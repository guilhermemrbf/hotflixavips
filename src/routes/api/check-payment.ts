import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createTelegramInviteLink } from "@/integrations/telegram.server";

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

const PAID_STATUSES = new Set([
  "paid",
  "completed",
  "approved",
  "success",
  "paid_out",
  "paidout",
  "settled",
]);

async function querySyncPay(txId: string): Promise<string | null> {
  try {
    const clientId = process.env.SYNCPAY_CLIENT_ID;
    const clientSecret = process.env.SYNCPAY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

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
    const token = authData?.access_token;
    if (!token) return null;

    const res = await fetch(
      `https://api.syncpayments.com.br/api/partner/v1/cash-in/${encodeURIComponent(txId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    );
    const data = await res.json().catch(() => ({}) as any);
    const status = data?.status || data?.data?.status || null;
    return status ? String(status).toLowerCase() : null;
  } catch (e) {
    console.error("[check-payment] querySyncPay erro", e);
    return null;
  }
}

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
            .select(
              "status, paid_at, winnpay_transaction_id, telegram_invite_link",
            )
            .eq("id", order_id)
            .maybeSingle();

          if (!order) {
            return json(200, {
              status: "not_found",
              paid_at: null,
              telegram_invite_link: null,
            });
          }

          // Fallback ativo: se ainda está pending e temos tx id, consulta SyncPay
          if (order.status === "pending" && order.winnpay_transaction_id) {
            const spStatus = await querySyncPay(order.winnpay_transaction_id);
            if (spStatus && PAID_STATUSES.has(spStatus)) {
              const paidAt = new Date().toISOString();
              const inviteLink =
                order.telegram_invite_link ??
                (await createTelegramInviteLink(order_id));
              await supabaseAdmin
                .from("orders")
                .update({
                  status: "paid",
                  paid_at: paidAt,
                  telegram_invite_link: inviteLink,
                })
                .eq("id", order_id);
              return json(200, {
                status: "paid",
                paid_at: paidAt,
                telegram_invite_link: inviteLink,
              });
            }
          }

          // Se já está pago mas o link não foi gerado por algum motivo, gera agora
          let inviteLink = order.telegram_invite_link ?? null;
          if (order.status === "paid" && !inviteLink) {
            inviteLink = await createTelegramInviteLink(order_id);
            await supabaseAdmin
              .from("orders")
              .update({ telegram_invite_link: inviteLink })
              .eq("id", order_id);
          }

          return json(200, {
            status: order.status,
            paid_at: order.paid_at,
            telegram_invite_link: inviteLink,
          });
        } catch (e) {
          return json(500, { error: String(e) });
        }
      },
    },
  },
});
