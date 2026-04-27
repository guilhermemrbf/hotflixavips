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
  bump: { title: "🎁 PACK SECRETO BONUS", cents: 390 },
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

          const syncClientId = process.env.SYNCPAY_CLIENT_ID;
          const syncClientSecret = process.env.SYNCPAY_CLIENT_SECRET;
          if (!syncClientId || !syncClientSecret) {
            return json(500, { error: "SYNCPAY credentials ausentes" });
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

          // 2) Chama SyncPay
          const amount = totalCents / 100;
          const supaUrl = process.env.SUPABASE_URL;
          const webhookUrl = supaUrl
            ? `${supaUrl}/functions/v1/webhook-syncpay`
            : `${new URL(request.url).origin}/api/public/syncpay-webhook`;

          // Auth token
          let token: string | undefined;
          try {
            const authRes = await fetch(
              "https://api.syncpayments.com.br/api/partner/v1/auth-token",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  client_id: syncClientId,
                  client_secret: syncClientSecret,
                }),
              },
            );
            const authData = await authRes.json().catch(() => ({}) as any);
            token = authData.access_token;
            if (!authRes.ok || !token) {
              console.error("[create-pix] SyncPay auth falhou", authData);
              await supabaseAdmin
                .from("orders")
                .update({ status: "failed", raw_response: authData })
                .eq("id", order.id);
              return json(200, {
                error: "syncpay_auth falhou",
                status: authRes.status,
                details: authData,
              });
            }
          } catch (netErr) {
            console.error("[create-pix] erro rede SyncPay auth", netErr);
            return json(200, {
              error: "SYNCPAY_NETWORK_ERROR",
              details: String(netErr),
            });
          }

          let spRes: Response;
          try {
            spRes = await fetch(
              "https://api.syncpayments.com.br/api/partner/v1/cash-in",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify({
                  amount,
                  description: fullTitle,
                  webhook_url: webhookUrl,
                  client: {
                    name: payerName,
                    email: payerEmail,
                    cpf: payerDocument,
                    phone: "11999999999",
                  },
                }),
              },
            );
          } catch (netErr) {
            console.error("[create-pix] erro rede SyncPay cash-in", netErr);
            await supabaseAdmin
              .from("orders")
              .update({
                status: "failed",
                raw_response: { network_error: String(netErr) },
              })
              .eq("id", order.id);
            return json(200, {
              error: "SYNCPAY_NETWORK_ERROR",
              details: String(netErr),
            });
          }

          const spData = await spRes.json().catch(() => ({}) as any);

          if (!spRes.ok || !spData?.identifier) {
            console.error("[create-pix] SyncPay falhou", spData);
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed", raw_response: spData })
              .eq("id", order.id);
            return json(200, {
              error: "syncpay falhou",
              status: spRes.status,
              details: spData,
            });
          }

          const qrCopyPaste: string | undefined = spData.pix_code;
          const qrBase64: string | undefined = undefined; // SyncPay não retorna imagem
          const txId = String(spData.identifier ?? "");

          await supabaseAdmin
            .from("orders")
            .update({
              winnpay_transaction_id: txId,
              pix_qr_code: qrBase64,
              pix_copy_paste: qrCopyPaste,
              raw_response: spData,
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
