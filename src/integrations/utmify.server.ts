// Utmify integration — server-only helper
// Docs: https://docs.utmify.com.br/

const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

type Status = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";

interface OrderForUtmify {
  orderId: string;
  planTitle: string;
  amountCents: number;
  status: Status;
  createdAt: string; // ISO
  paidAt?: string | null; // ISO or null
  payerEmail?: string | null;
  payerName?: string | null;
  payerDocument?: string | null;
  payerIp?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
}

// Utmify expects "YYYY-MM-DD HH:mm:ss" in UTC
function toUtmifyDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export async function sendOrderToUtmify(order: OrderForUtmify): Promise<void> {
  const token = process.env.UTMIFY_API_TOKEN;
  if (!token) {
    console.warn("[utmify] UTMIFY_API_TOKEN ausente — pulando envio");
    return;
  }

  const payload = {
    orderId: order.orderId,
    platform: "LovableCheckout",
    paymentMethod: "pix",
    status: order.status,
    createdAt: toUtmifyDate(order.createdAt),
    approvedDate: order.status === "paid" ? toUtmifyDate(order.paidAt) : null,
    refundedAt: null,
    customer: {
      name: order.payerName || "Cliente VIP",
      email: order.payerEmail || "cliente@checkout.app",
      phone: null,
      document: order.payerDocument || null,
      country: "BR",
      ip: order.payerIp || "0.0.0.0",
    },
    products: [
      {
        id: order.orderId,
        name: order.planTitle,
        planId: null,
        planName: order.planTitle,
        quantity: 1,
        priceInCents: order.amountCents,
      },
    ],
    trackingParameters: {
      src: null,
      sck: null,
      utm_source: order.utm_source || null,
      utm_medium: order.utm_medium || null,
      utm_campaign: order.utm_campaign || null,
      utm_term: order.utm_term || null,
      utm_content: order.utm_content || null,
    },
    commission: {
      totalPriceInCents: order.amountCents,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amountCents,
    },
    isTest: false,
  };

  try {
    const res = await fetch(UTMIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[utmify] falhou", res.status, text);
    } else {
      console.log("[utmify] enviado", order.orderId, order.status);
    }
  } catch (e) {
    console.error("[utmify] erro de rede", e);
  }
}
