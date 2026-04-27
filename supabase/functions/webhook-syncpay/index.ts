import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();

    const evento = req.headers.get("event") || "";
    const status = body?.data?.status;
    const transacaoId = body?.data?.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (evento === "cashin.create") {
      await supabase
        .from("pagamentos")
        .update({ status: "pendente" })
        .eq("transacao_id", transacaoId);
    }

    if (evento === "cashin.update" && status === "completed") {
      await supabase
        .from("pagamentos")
        .update({ status: "pago" })
        .eq("transacao_id", transacaoId);

      // Também atualiza o fluxo antigo (orders) se houver pedido vinculado
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          raw_webhook: body,
        })
        .eq("winnpay_transaction_id", transacaoId);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("webhook-syncpay error", err);
    return new Response("error", { status: 500 });
  }
});