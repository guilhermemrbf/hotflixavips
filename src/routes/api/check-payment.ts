import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/check-payment")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),

      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const order_id = url.searchParams.get("order_id");
          if (!order_id) return json(400, { error: "order_id obrigatório" });

          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("status, paid_at, winnpay_transaction_id")
            .eq("id", order_id)
            .maybeSingle();

          if (!order) {
            return json(200, { status: "not_found", paid_at: null });
          }

          // Fallback: confirma direto na MP se ainda pendente
          if (order.status === "pending" && order.winnpay_transaction_id) {
            const accessToken = process.env.MP_ACCESS_TOKEN;
            if (accessToken) {
              try {
                const mpRes = await fetch(
                  `https://api.mercadopago.com/v1/payments/${order.winnpay_transaction_id}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const payment = await mpRes.json();
                if (mpRes.ok && payment.status === "approved") {
                  const paidAt = new Date().toISOString();
                  await supabaseAdmin
                    .from("orders")
                    .update({
                      status: "paid",
                      paid_at: paidAt,
                      raw_webhook: payment,
                    })
                    .eq("id", order_id);
                  return json(200, { status: "paid", paid_at: paidAt });
                }
              } catch (e) {
                console.error("[check-payment] erro consulta MP", e);
              }
            }
          }

          return json(200, {
            status: order.status,
            paid_at: order.paid_at,
          });
        } catch (e) {
          return json(500, { error: String(e) });
        }
      },
    },
  },
});
