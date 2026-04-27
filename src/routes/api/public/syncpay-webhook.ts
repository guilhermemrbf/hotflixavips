import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOrderToUtmify } from "@/integrations/utmify.server";

export const Route = createFileRoute("/api/public/syncpay-webhook")({
  server: {
    handlers: {
      GET: async () => new Response("ok", { status: 200 }),

      POST: async ({ request }) => {
        try {
          const rawText = await request.text();
          let body: any = {};
          try {
            body = JSON.parse(rawText);
          } catch {
            body = {};
          }

          const eventHeader = request.headers.get("event") || "";
          const event =
            body?.event || body?.type || eventHeader || "";
          // SyncPay pode mandar transacao em data.id, identifier, ou id
          const txId =
            body?.data?.id ||
            body?.data?.identifier ||
            body?.identifier ||
            body?.id ||
            null;
          const status =
            body?.data?.status || body?.status || "";

          console.log("[syncpay-webhook] recebido", {
            event,
            txId,
            status,
            bodyKeys: Object.keys(body || {}),
          });

          if (!txId) {
            return new Response(
              JSON.stringify({ ok: true, ignored: "sem txId" }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // Procura pedido correspondente — idempotente via winnpay_transaction_id
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("winnpay_transaction_id", String(txId))
            .maybeSingle();

          if (!order) {
            console.warn("[syncpay-webhook] pedido não encontrado", txId);
            return new Response(
              JSON.stringify({ ok: true, found: false }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          // Idempotência: se já está pago, apenas confirma
          if (order.status === "paid") {
            return new Response(
              JSON.stringify({ ok: true, already_paid: true }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const normalized = String(status).toLowerCase();
          const isPaid =
            normalized === "completed" ||
            normalized === "paid" ||
            normalized === "approved" ||
            normalized === "success";
          const isFailed =
            normalized === "failed" ||
            normalized === "canceled" ||
            normalized === "cancelled" ||
            normalized === "refused" ||
            normalized === "rejected";

          if (!isPaid && !isFailed) {
            // só loga e sai (eventos tipo cashin.create / pending)
            await supabaseAdmin
              .from("orders")
              .update({ raw_webhook: body })
              .eq("id", order.id);
            return new Response(
              JSON.stringify({ ok: true, status: order.status }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          }

          const newStatus = isPaid ? "paid" : "failed";
          const paidAt = isPaid ? new Date().toISOString() : order.paid_at;

          await supabaseAdmin
            .from("orders")
            .update({
              status: newStatus,
              paid_at: paidAt,
              raw_webhook: body,
            })
            .eq("id", order.id);

          console.log("[syncpay-webhook] pedido atualizado", {
            id: order.id,
            newStatus,
          });

          await sendOrderToUtmify({
            orderId: order.id,
            planTitle: order.plan_title,
            amountCents: order.amount_cents,
            status: isPaid ? "paid" : "refused",
            createdAt: order.created_at,
            paidAt: paidAt ?? null,
            payerEmail: order.payer_email,
            payerName: order.payer_name,
            payerDocument: order.payer_document,
            utm_source: order.utm_source,
            utm_medium: order.utm_medium,
            utm_campaign: order.utm_campaign,
            utm_term: order.utm_term,
            utm_content: order.utm_content,
          });

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("[syncpay-webhook] erro", e);
          return new Response("ok", { status: 200 });
        }
      },
    },
  },
});
