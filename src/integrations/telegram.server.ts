// Telegram — server-only helper para gerar links de convite únicos
// no canal VIP via connector gateway da Lovable.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
const VIP_CHANNEL_ID = -1003897460626; // ID do canal VIP
const FALLBACK_INVITE_URL = "https://t.me/+0ApNmK8IQSFmNDRh";

/**
 * Cria um link de convite único (1 uso, expira em 1h) para o canal VIP.
 * Retorna a URL `t.me/...`. Em caso de erro, retorna o fallback estático
 * pra nunca bloquear o cliente que acabou de pagar.
 */
export async function createTelegramInviteLink(
  orderId: string,
): Promise<string> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;

  if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY) {
    console.warn("[telegram] credenciais ausentes — usando fallback");
    return FALLBACK_INVITE_URL;
  }

  try {
    const expireDate = Math.floor(Date.now() / 1000) + 60 * 60; // +1h
    const res = await fetch(`${GATEWAY_URL}/createChatInviteLink`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: VIP_CHANNEL_ID,
        name: `VIP ${orderId.slice(0, 8)}`,
        expire_date: expireDate,
        member_limit: 1,
        creates_join_request: false,
      }),
    });

    const data = await res.json().catch(() => ({}) as any);
    if (!res.ok || !data?.result?.invite_link) {
      console.error(
        "[telegram] createChatInviteLink falhou",
        res.status,
        JSON.stringify(data),
      );
      return FALLBACK_INVITE_URL;
    }

    return String(data.result.invite_link);
  } catch (e) {
    console.error("[telegram] erro de rede", e);
    return FALLBACK_INVITE_URL;
  }
}