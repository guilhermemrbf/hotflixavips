import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Step = {
  step: string;
  ok: boolean;
  detail?: unknown;
};

/**
 * Rota de diagnóstico end-to-end da integração SyncPay.
 * GET /api/test-syncpay
 *
 * Executa em sequência:
 *  1. Verifica secrets SYNCPAY_CLIENT_ID / SYNCPAY_CLIENT_SECRET
 *  2. Autentica (auth-token)
 *  3. Cria um PIX de teste de R$ 1,00 (cash-in) com webhook apontando
 *     para a edge function webhook-syncpay
 *  4. Consulta o status do PIX gerado (cash-in/:id)
 *  5. Insere um pedido e simula um webhook de pagamento chamando
 *     a própria edge function webhook-syncpay, depois confere se o
 *     status foi atualizado para "paid"
 *
 * Retorna um JSON com cada etapa marcada como ok/falha para diagnóstico rápido.
 */
export const Route = createFileRoute("/api/test-syncpay")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        const steps: Step[] = [];
        const push = (s: Step) => {
          steps.push(s);
          return s;
        };

        const clientId = process.env.SYNCPAY_CLIENT_ID;
        const clientSecret = process.env.SYNCPAY_CLIENT_SECRET;
        const supaUrl = process.env.SUPABASE_URL;
        const anonKey =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY;

        push({
          step: "1. secrets",
          ok: Boolean(clientId && clientSecret && supaUrl),
          detail: {
            SYNCPAY_CLIENT_ID: clientId ? "ok" : "MISSING",
            SYNCPAY_CLIENT_SECRET: clientSecret ? "ok" : "MISSING",
            SUPABASE_URL: supaUrl ? "ok" : "MISSING",
          },
        });

        if (!clientId || !clientSecret || !supaUrl) {
          return json(200, { ok: false, steps });
        }

        // 2. auth
        let token = "";
        try {
          const authRes = await fetch(
            "https://api.syncpayments.com.br/api/partner/v1/auth-token",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
              }),
            },
          );
          const authData = await authRes.json().catch(() => ({}) as any);
          token = authData.access_token ?? "";
          push({
            step: "2. auth-token",
            ok: authRes.ok && Boolean(token),
            detail: {
              http: authRes.status,
              has_token: Boolean(token),
              body: authRes.ok ? "***" : authData,
            },
          });
          if (!authRes.ok || !token)
            return json(200, { ok: false, steps });
        } catch (e) {
          push({ step: "2. auth-token", ok: false, detail: String(e) });
          return json(200, { ok: false, steps });
        }

        // 3. cria PIX de teste R$1,00
        const webhookUrl = `${supaUrl}/functions/v1/webhook-syncpay`;
        let identifier = "";
        let pixCode = "";
        try {
          const spRes = await fetch(
            "https://api.syncpayments.com.br/api/partner/v1/cash-in",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                amount: 1,
                description: "TESTE diagnóstico SyncPay",
                webhook_url: webhookUrl,
                client: {
                  name: "Teste Diagnostico",
                  email: "teste@diag.app",
                  cpf: "19119119100",
                  phone: "11999999999",
                },
              }),
            },
          );
          const spData = await spRes.json().catch(() => ({}) as any);
          identifier = String(spData?.identifier ?? "");
          pixCode = String(spData?.pix_code ?? "");
          push({
            step: "3. cash-in (gerar PIX R$1)",
            ok: spRes.ok && Boolean(identifier),
            detail: {
              http: spRes.status,
              identifier,
              has_pix_code: Boolean(pixCode),
              webhook_url: webhookUrl,
              body: spRes.ok ? undefined : spData,
            },
          });
          if (!spRes.ok || !identifier)
            return json(200, { ok: false, steps });
        } catch (e) {
          push({ step: "3. cash-in", ok: false, detail: String(e) });
          return json(200, { ok: false, steps });
        }

        // 4. consulta status do PIX recém criado
        try {
          const qRes = await fetch(
            `https://api.syncpayments.com.br/api/partner/v1/cash-in/${identifier}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const qData = await qRes.json().catch(() => ({}) as any);
          push({
            step: "4. consulta cash-in/:id",
            ok: qRes.ok,
            detail: {
              http: qRes.status,
              status: qData?.status ?? qData?.data?.status,
              body: qRes.ok ? { status: qData?.status } : qData,
            },
          });
        } catch (e) {
          push({ step: "4. consulta cash-in/:id", ok: false, detail: String(e) });
        }

        // 5. cria order vinculado ao identifier e dispara webhook simulado
        const { data: order, error: insertErr } = await supabaseAdmin
          .from("orders")
          .insert({
            plan_id: "test",
            plan_title: "TESTE diagnóstico",
            amount_cents: 100,
            status: "pending",
            winnpay_transaction_id: identifier,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
          .select()
          .single();
        push({
          step: "5a. insert order (pending)",
          ok: !insertErr && Boolean(order),
          detail: insertErr ?? { order_id: order?.id },
        });
        if (!order) return json(200, { ok: false, steps });

        // Dispara webhook simulado (status=paid)
        try {
          const whRes = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
              ...(anonKey ? { apikey: anonKey } : {}),
            },
            body: JSON.stringify({
              identifier,
              status: "paid",
              amount: 1,
              paid_at: new Date().toISOString(),
              test: true,
            }),
          });
          const whBody = await whRes.text().catch(() => "");
          push({
            step: "5b. POST webhook-syncpay (simulado)",
            ok: whRes.ok,
            detail: { http: whRes.status, body: whBody.slice(0, 400) },
          });
        } catch (e) {
          push({
            step: "5b. POST webhook-syncpay",
            ok: false,
            detail: String(e),
          });
        }

        // 5c. relê o pedido para ver se virou paid
        const { data: after } = await supabaseAdmin
          .from("orders")
          .select("status, paid_at")
          .eq("id", order.id)
          .maybeSingle();
        push({
          step: "5c. order atualizado para paid?",
          ok: after?.status === "paid",
          detail: after,
        });

        const okAll = steps.every((s) => s.ok);
        return json(200, {
          ok: okAll,
          summary: okAll
            ? "✅ Integração SyncPay funcionando ponta-a-ponta"
            : "❌ Há falhas — veja steps abaixo",
          order_id: order.id,
          identifier,
          pix_copy_paste: pixCode,
          steps,
        });
      },
    },
  },
});