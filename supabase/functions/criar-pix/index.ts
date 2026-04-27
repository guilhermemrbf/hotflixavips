import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getToken(): Promise<string> {
  const res = await fetch("https://api.syncpayments.com.br/api/partner/v1/auth-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: Deno.env.get("SYNCPAY_CLIENT_ID"),
      client_secret: Deno.env.get("SYNCPAY_CLIENT_SECRET"),
    }),
  });
  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { valor, email, nome, telefone, cpf, utms } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-syncpay`;

    const token = await getToken();

    const response = await fetch("https://api.syncpayments.com.br/api/partner/v1/cash-in", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: valor,
        description: "Acesso VIP Telegram - Leticia VIP",
        webhook_url: webhookUrl,
        client: {
          name: nome,
          email,
          cpf: String(cpf ?? "").replace(/\D/g, ""),
          phone: String(telefone ?? "").replace(/\D/g, ""),
        },
      }),
    });

    const data = await response.json();

    if (!data?.identifier) {
      return new Response(JSON.stringify({ error: "Erro ao gerar PIX", details: data }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("pagamentos").insert({
      transacao_id: data.identifier,
      status: "pendente",
      email,
      nome,
      valor,
      utm_source: utms?.utm_source || "",
      utm_medium: utms?.utm_medium || "",
      utm_campaign: utms?.utm_campaign || "",
      utm_term: utms?.utm_term || "",
      utm_content: utms?.utm_content || "",
    });

    return new Response(
      JSON.stringify({
        transacao_id: data.identifier,
        qr_code: data.pix_code,
        qr_code_img: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});