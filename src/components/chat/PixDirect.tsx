import { useEffect, useState } from "react";
import { CtaButton } from "./CtaButton";
import type { Plan } from "./PlanCard";
import { captureUtms } from "@/lib/utms";

interface Props {
  plan: Plan;
  onPaid: () => void;
}

interface PixData {
  order_id: string;
  amount_cents: number;
  plan_title: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
  expires_at: string;
}

export function PixDirect({ plan, onPaid }: Props) {
  const [loading, setLoading] = useState(true);
  const [pix, setPix] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(599);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bump, setBump] = useState(false);

  // 1) Gerar Pix (re-gera se trocar o bump)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPix(null);
      setSeconds(599);
      const utms = captureUtms();
      try {
        const res = await fetch("/api/create-pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan_id: plan.id, utms, bump }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          console.error("create-pix error", data);
          setError("Falha ao gerar Pix. Tenta de novo em instantes.");
        } else {
          setPix(data as PixData);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError("Falha ao gerar Pix. Tenta de novo em instantes.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan.id, bump]);

  // 2) Timer
  useEffect(() => {
    if (!pix || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [pix, seconds]);

  // 3) Polling de pagamento
  useEffect(() => {
    if (!pix) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/check-payment?order_id=${encodeURIComponent(pix.order_id)}`
        );
        const data = await res.json();
        if (data?.status === "paid") {
          clearInterval(t);
          onPaid();
        }
      } catch {
        /* silencioso */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [pix, onPaid]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const totalLabel = pix
    ? `R$ ${(pix.amount_cents / 100).toFixed(2).replace(".", ",")}`
    : plan.price;

  const handleCopy = async () => {
    if (!pix?.pix_copy_paste) return;
    await navigator.clipboard.writeText(pix.pix_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckNow = async () => {
    if (!pix) return;
    setChecking(true);
    try {
      const res = await fetch(
        `/api/check-payment?order_id=${encodeURIComponent(pix.order_id)}`
      );
      const data = await res.json();
      if (data?.status === "paid") onPaid();
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div
        className="space-y-4 px-1 text-center py-12"
        style={{ animation: "message-in 0.5s ease both" }}
      >
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Gerando seu Pix… ⚡</p>
      </div>
    );
  }

  if (error || !pix) {
    return (
      <div
        className="space-y-4 px-1 text-center py-8"
        style={{ animation: "message-in 0.5s ease both" }}
      >
        <p className="text-3xl">⚠️</p>
        <p className="text-sm text-foreground font-medium">
          {error ?? "Erro ao gerar Pix"}
        </p>
        <CtaButton onClick={() => location.reload()}>TENTAR DE NOVO</CtaButton>
      </div>
    );
  }

  const qrSrc = pix.pix_qr_code
    ? pix.pix_qr_code.startsWith("http") || pix.pix_qr_code.startsWith("data:")
      ? pix.pix_qr_code
      : `data:image/png;base64,${pix.pix_qr_code}`
    : null;

  return (
    <div
      className="space-y-4 px-1"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <div className="text-center">
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-3 py-1 rounded-full">
          Pix gerado · {pix.plan_title}
        </span>
        <h2 className="text-xl font-extrabold text-foreground mt-3">
          Falta <span className="text-gradient">1 passo</span> pra entrar comigo
          😘
        </h2>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/40 p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Expira em
        </p>
        <p className="text-4xl font-bold text-gradient tabular-nums">
          {mm}:{ss}
        </p>
      </div>

      {/* Order Bump */}
      <button
        type="button"
        onClick={() => setBump((v) => !v)}
        className={`w-full text-left rounded-2xl border-2 p-4 transition-all relative overflow-hidden active:scale-[0.99] ${
          bump
            ? "border-primary bg-gradient-to-br from-primary/20 via-card to-card neon-glow"
            : "border-dashed border-primary/50 bg-card/60 hover:border-primary"
        }`}
      >
        <div className="absolute -top-px left-3 text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-2.5 py-1 rounded-b-lg shadow-lg">
          🎁 BÔNUS EXCLUSIVO
        </div>
        <div className="flex items-start gap-3 mt-3">
          <div
            className={`shrink-0 mt-0.5 h-6 w-6 rounded-md border-2 flex items-center justify-center transition ${
              bump
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-transparent"
            }`}
          >
            {bump && (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-extrabold text-foreground leading-tight">
              🎁 𝗩𝗢𝗖𝗘 𝗚𝗔𝗡𝗛𝗢𝗨 𝗕𝗢𝗡𝗨𝗦 🔥
            </p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
              ⚠️ Se você já chegou até aqui… sabe exatamente o que quer. Adicione o pacote bônus secreto pra liberar tudo de uma vez 😈
            </p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xs text-muted-foreground line-through">R$ 19,90</span>
              <span className="text-lg font-extrabold text-gradient">+ R$ 3,90</span>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider">só hoje</span>
            </div>
          </div>
        </div>
      </button>

      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 text-center">
        <div className="mx-auto h-40 w-40 sm:h-44 sm:w-44 rounded-xl bg-white p-2.5 sm:p-3 flex items-center justify-center overflow-hidden">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code Pix"
              className="h-full w-full object-contain"
            />
          ) : (
            <p className="text-xs text-black">
              QR Code indisponível — use o código abaixo
            </p>
          )}
        </div>
        <p className="text-sm sm:text-base text-foreground mt-3 font-medium">
          {totalLabel} via Pix
        </p>
        <p className="text-xs text-muted-foreground">
          Escaneie com o app do seu banco
        </p>
      </div>

      <button
        onClick={handleCopy}
        disabled={!pix.pix_copy_paste}
        className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm font-medium text-foreground hover:border-primary/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {copied ? "✓ Código copiado!" : "📋 Copiar código Pix"}
      </button>

      <div className="rounded-2xl bg-card/60 border border-border p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary text-center">
          Como pagar em 30 segundos
        </p>
        <ol className="space-y-2.5">
          {[
            {
              n: "1",
              t: "Abra o app do seu banco",
              d: "Nubank, Itaú, Caixa, PicPay, Mercado Pago…",
            },
            {
              n: "2",
              t: "Escolha pagar com Pix",
              d: 'Toque em "Copia e Cola" ou "Ler QR Code"',
            },
            {
              n: "3",
              t: "Cole o código ou escaneie o QR",
              d: "Confira o valor e finalize",
            },
            {
              n: "4",
              t: "Pronto! Acesso liberado 🔥",
              d: "Liberação automática em segundos",
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-3 items-start">
              <span className="shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-[11px] font-bold flex items-center justify-center neon-glow">
                {s.n}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  {s.t}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {s.d}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">⚠️</span>
          <div className="space-y-1.5">
            <p className="text-[12px] font-bold text-amber-200 leading-tight">
              Nome do recebedor vai aparecer diferente — é normal!
            </p>
            <p className="text-[11px] text-amber-100/90 leading-snug">
              O Pix é processado por uma{" "}
              <strong>processadora de pagamentos segura</strong> (gateway). Por
              isso vai aparecer um nome de empresa (ex: <em>Mercado Pago, WinnPay, Guilherme</em>)
              em vez do meu nome — isso protege a minha identidade e a sua. 🔒
            </p>
            <p className="text-[11px] text-amber-100/90 leading-snug">
              Se o seu banco mostrar <strong>alerta de golpe</strong> ou pedir
              confirmação, pode prosseguir tranquilo(a) — é só o banco avisando
              que é a primeira vez que você paga pra esse recebedor.{" "}
              <strong>Confirme e finalize normalmente.</strong>
            </p>
          </div>
        </div>
      </div>

      <CtaButton onClick={handleCheckNow} disabled={checking}>
        {checking ? "VERIFICANDO…" : "JÁ PAGUEI ✅"}
      </CtaButton>

      <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
        🔒 Liberação{" "}
        <strong className="text-foreground">100% automática</strong> assim que o
        Pix cair · pagamento processado por gateway certificado
      </p>
    </div>
  );
}
