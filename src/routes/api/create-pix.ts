import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendOrderToUtmify } from "@/integrations/utmify.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PLANS: Record<string, { title: string; cents: number }> = {
  vital: { title: "🥇 Vitalício + 500 Mídias 🔥", cents: 1290 },
  bonus: { title: "💎 VITALÍCIO + BÔNUS 🎁", cents: 890 },
  week: { title: "🟢 1 SEMANA 🟢", cents: 690 },
  videocall: { title: "📹 CHAMADA DE VÍDEO", cents: 2290 },
};

const ORDER_BUMP = {
  id: "bump_bonus",
  title: "🎁 PACOTE BÔNUS SECRETO 🔥",
  cents: 390,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/create-pix")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      POST: async ({ request }) => {
        try {
          const { plan_id, utms, bump } = (await request.json()) as {
            plan_id?: string;
            utms?: Record<string, string>;
            bump?: boolean;
          };

          const plan = plan_id ? PLANS[plan_id] : undefined;
          if (!plan_id || !plan) {
            return json(400, { error: "plano inválido" });
          }

          const accessToken = process.env.MP_ACCESS_TOKEN;
          if (!accessToken) {
            return json(500, { error: "MP_ACCESS_TOKEN ausente" });
          }

          const utmsClean = {
            utm_source: utms?.utm_source ?? "",
            utm_medium: utms?.utm_medium ?? "",
            utm_campaign: utms?.utm_campaign ?? "",
            utm_term: utms?.utm_term ?? "",
            utm_content: utms?.utm_content ?? "",
          };

          // Soma do order bump se marcado
          const totalCents = plan.cents + (bump ? ORDER_BUMP.cents : 0);
          const fullTitle = bump
            ? `${plan.title} + ${ORDER_BUMP.title}`
            : plan.title;

          // Dados padrão do pagador (sem formulário)
          const payerEmail = `cliente-${crypto.randomUUID().slice(0, 8)}@checkout.app`;
          const payerName = "Cliente VIP";
          const payerDocument = "19119119100";

          // 1) Cria pedido pendente
          const { data: order, error: insertErr } = await supabaseAdmin
            .from("orders")
            .insert({
              plan_id: bump ? `${plan_id}+bump` : plan_id,
              plan_title: fullTitle,
              amount_cents: totalCents,
              status: "pending",
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              utm_source: utmsClean.utm_source,
              utm_medium: utmsClean.utm_medium,
              utm_campaign: utmsClean.utm_campaign,
              utm_term: utmsClean.utm_term,
              utm_content: utmsClean.utm_content,
              payer_email: payerEmail,
              payer_name: payerName,
              payer_document: payerDocument,
            })
            .select()
            .single();

          if (insertErr || !order) {
            console.error("orders insert error", insertErr);
            return json(500, { error: "falha ao criar pedido" });
          }

          // 2) Chama Mercado Pago
          const amount = totalCents / 100;
          const supaUrl = process.env.SUPABASE_URL;
          const notification_url = supaUrl
            ? `${supaUrl}/functions/v1/mp-webhook`
            : `${new URL(request.url).origin}/api/public/mp-webhook`;

          const mpPayload = {
            transaction_amount: amount,
            description: fullTitle,
            payment_method_id: "pix",
            external_reference: order.id,
            notification_url,
            date_of_expiration: new Date(Date.now() + 10 * 60 * 1000)
              .toISOString()
              .replace("Z", "-00:00"),
            payer: {
              email: payerEmail,
              first_name: "Cliente",
              last_name: "VIP",
              identification: { type: "CPF", number: payerDocument },
            },
          };

          let mpRes: Response;
          try {
            mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": order.id,
              },
              body: JSON.stringify(mpPayload),
            });
          } catch (netErr) {
            console.error("[create-pix] erro de rede MP", netErr);
            await supabaseAdmin
              .from("orders")
              .update({
                status: "failed",
                raw_response: { network_error: String(netErr) },
              })
              .eq("id", order.id);
            return json(200, {
              error: "MP_NETWORK_ERROR",
              details: String(netErr),
            });
          }

          const mpData = await mpRes.json().catch(() => ({}) as any);

          if (!mpRes.ok) {
            console.error("[create-pix] MP falhou", mpData);
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed", raw_response: mpData })
              .eq("id", order.id);
            return json(200, {
              error: "mercado_pago falhou",
              status: mpRes.status,
              details: mpData,
            });
          }

          const txData = mpData.point_of_interaction?.transaction_data;
          const qrBase64 = txData?.qr_code_base64;
          const qrCopyPaste = txData?.qr_code;
          const txId = String(mpData.id ?? "");

          await supabaseAdmin
            .from("orders")
            .update({
              winnpay_transaction_id: txId,
              pix_qr_code: qrBase64,
              pix_copy_paste: qrCopyPaste,
              raw_response: mpData,
            })
            .eq("id", order.id);

          // Notifica Utmify — pedido aguardando pagamento
          await sendOrderToUtmify({
            orderId: order.id,
            planTitle: fullTitle,
            amountCents: totalCents,
            status: "waiting_payment",
            createdAt: order.created_at,
            paidAt: null,
            payerEmail,
            payerName,
            payerDocument,
            utm_source: utmsClean.utm_source,
            utm_medium: utmsClean.utm_medium,
            utm_campaign: utmsClean.utm_campaign,
            utm_term: utmsClean.utm_term,
            utm_content: utmsClean.utm_content,
          });

          return json(200, {
            order_id: order.id,
            amount_cents: totalCents,
            plan_title: fullTitle,
            pix_qr_code: qrBase64,
            pix_copy_paste: qrCopyPaste,
            expires_at: order.expires_at,
          });
        } catch (e) {
          console.error("[create-pix] erro inesperado", e);
          return json(500, { error: String(e) });
        }
      },
    },
  },
});
