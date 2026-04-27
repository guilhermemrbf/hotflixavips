import { createFileRoute } from "@tanstack/react-router";
import { sendOrderToUtmify } from "@/integrations/utmify.server";

export const Route = createFileRoute("/api/public/utmify-test")({
  server: {
    handlers: {
      GET: async () => {
        const orderId = `test-${Date.now()}`;
        const now = new Date().toISOString();

        try {
          // 1) Pedido pendente
          await sendOrderToUtmify({
            orderId,
            planTitle: "🧪 TESTE — Vitalício VIP",
            amountCents: 1290,
            status: "waiting_payment",
            createdAt: now,
            paidAt: null,
            payerEmail: "teste@checkout.app",
            payerName: "Cliente Teste",
            payerDocument: "19119119100",
            utm_source: "teste",
            utm_medium: "manual",
            utm_campaign: "validacao_integracao",
            utm_term: "pix",
            utm_content: "endpoint_test",
          });

          // 2) Pedido aprovado (segundos depois)
          await sendOrderToUtmify({
            orderId,
            planTitle: "🧪 TESTE — Vitalício VIP",
            amountCents: 1290,
            status: "paid",
            createdAt: now,
            paidAt: new Date().toISOString(),
            payerEmail: "teste@checkout.app",
            payerName: "Cliente Teste",
            payerDocument: "19119119100",
            utm_source: "teste",
            utm_medium: "manual",
            utm_campaign: "validacao_integracao",
            utm_term: "pix",
            utm_content: "endpoint_test",
          });

          return Response.json({
            ok: true,
            orderId,
            message:
              "2 eventos enviados (waiting_payment + paid). Confira no painel da Utmify.",
          });
        } catch (e) {
          return Response.json(
            { ok: false, error: String(e) },
            { status: 500 }
          );
        }
      },
    },
  },
});
