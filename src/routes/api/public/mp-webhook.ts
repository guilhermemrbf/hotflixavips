import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOrderToUtmify } from "@/integrations/utmify.server";

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      GET: async () => new Response("ok", { status: 200 }),

      POST: async ({ request }) => {
        try {
          const accessToken = process.env.MP_ACCESS_TOKEN;
          if (!accessToken) {
            console.error("[mp-webhook] MP_ACCESS_TOKEN ausente");
            return new Response("ok", { status: 200 });
          }

          const url = new URL(request.url);
          const queryId =
            url.searchParams.get("data.id") || url.searchParams.get("id");
          const queryType =
            url.searchParams.get("type") || url.searchParams.get("topic");

          let body: any = {};
          try {
            body = await request.json();
          } catch {
            body = {};
          }

          console.log("[mp-webhook] recebido", { queryType, queryId, body });

          const type = body.type || body.topic || queryType;
          const paymentId = body.data?.id || body.id || queryId;

          if (type !== "payment" || !paymentId) {
            return new Response(JSON.stringify({ ok: true, ignored: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const mpRes = await fetch(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const payment = await mpRes.json();
          console.log(
            "[mp-webhook] payment status",
            payment.status,
            "external_ref:",
            payment.external_reference
          );

          if (!mpRes.ok) {
            console.error("[mp-webhook] erro buscar payment", payment);
            return new Response("ok", { status: 200 });
          }

          const externalRef = payment.external_reference;
          const txId = String(payment.id);

          let order: any = null;
          if (externalRef) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("*")
              .eq("id", externalRef)
              .maybeSingle();
            order = data;
          }
          if (!order) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("*")
              .eq("winnpay_transaction_id", txId)
              .maybeSingle();
            order = data;
          }

          if (!order) {
            console.warn("[mp-webhook] pedido não encontrado", {
              externalRef,
              txId,
            });
            return new Response(JSON.stringify({ ok: true, found: false }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const isPaid = payment.status === "approved";
          const isRejected = payment.status === "rejected";
          const newStatus = isPaid
            ? "paid"
            : isRejected
              ? "failed"
              : order.status;
          const paidAt = isPaid ? new Date().toISOString() : order.paid_at;

          await supabaseAdmin
            .from("orders")
            .update({
              status: newStatus,
              paid_at: paidAt,
              raw_webhook: payment,
              winnpay_transaction_id: txId,
            })
            .eq("id", order.id);

          console.log("[mp-webhook] pedido atualizado", {
            id: order.id,
            isPaid,
          });

          // Notifica Utmify quando o status mudar
          if (isPaid || isRejected) {
            await sendOrderToUtmify({
              orderId: order.id,
              planTitle: order.plan_title,
              amountCents: order.amount_cents,
              status: isPaid ? "paid" : "refused",
              createdAt: order.created_at,
              paidAt,
              payerEmail: order.payer_email,
              payerName: order.payer_name,
              payerDocument: order.payer_document,
              utm_source: order.utm_source,
              utm_medium: order.utm_medium,
              utm_campaign: order.utm_campaign,
              utm_term: order.utm_term,
              utm_content: order.utm_content,
            });
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[mp-webhook] erro", e);
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
