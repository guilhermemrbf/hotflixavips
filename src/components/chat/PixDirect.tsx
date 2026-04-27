import { useEffect, useRef, useState } from "react";
import { CtaButton } from "./CtaButton";
import type { Plan } from "./PlanCard";
import { captureUtms } from "@/lib/utms";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  plan: Plan;
  withBump?: boolean;
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

export function PixDirect({ plan, withBump = false, onPaid }: Props) {
  const [loading, setLoading] = useState(true);
  const [pix, setPix] = useState<PixData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(599);
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">("idle");
  const [checking, setChecking] = useState(false);
  const bump = withBump;
  // Guard contra double-invoke do StrictMode / re-render
  const createdForPlanRef = useRef<string | null>(null);

  // 1) Gerar Pix (re-gera se trocar o bump)
  useEffect(() => {
    const key = `${plan.id}:${bump}`;
    if (createdForPlanRef.current === key) return;
    createdForPlanRef.current = key;
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
          // permite retry manual mudando o ref
          createdForPlanRef.current = null;
        } else {
          setPix(data as PixData);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError("Falha ao gerar Pix. Tenta de novo em instantes.");
          createdForPlanRef.current = null;
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
    if (copyState === "copying") return;
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(pix.pix_copy_paste);
      // pequeno atraso pra feedback "Copiando..." ser perceptível
      await new Promise((r) => setTimeout(r, 350));
      setCopyState("copied");
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopyState("idle"), 2600);
    } catch {
      setCopyState("idle");
    }
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
      className="space-y-2.5 px-0.5"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <div className="text-center">
        <span className="inline-block text-[9.5px] font-bold uppercase tracking-widest bg-primary/15 text-primary px-2.5 py-0.5 rounded-full">
          Pix gerado · {pix.plan_title} · 🔥 Club Proibido - Hotflix
        </span>
        <h2 className="text-[16px] sm:text-xl font-extrabold text-foreground mt-2 leading-tight px-2">
          Falta <span className="text-gradient">1 passo</span> pra voce entrar
        </h2>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/40 px-3 py-1.5 flex items-center justify-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          ⏳ Expira em
        </span>
        <span className="text-[20px] sm:text-2xl font-extrabold text-gradient tabular-nums leading-none">
          {mm}:{ss}
        </span>
      </div>

      <div className="rounded-2xl bg-card border border-border p-3 text-center">
        <div className="mx-auto h-36 w-36 sm:h-44 sm:w-44 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code Pix"
              className="h-full w-full object-contain"
            />
          ) : pix.pix_copy_paste ? (
            <QRCodeSVG
              value={pix.pix_copy_paste}
              size={148}
              level="M"
              className="h-full w-full"
            />
          ) : (
            <p className="text-xs text-black">
              QR Code indisponível — use o código abaixo
            </p>
          )}
        </div>
        <p className="text-[15px] sm:text-lg text-foreground mt-2 font-extrabold">
          {totalLabel} <span className="text-muted-foreground font-medium text-[12px]">via Pix</span>
        </p>
      </div>

      {/* Ação principal no mobile: copiar código */}
      <button
        onClick={handleCopy}
        disabled={!pix.pix_copy_paste || copyState === "copying"}
        aria-live="polite"
        className={`relative w-full overflow-hidden rounded-2xl px-4 py-3 text-[14px] font-extrabold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] ${
          copyState === "copied"
            ? "bg-online/20 border-2 border-online text-online scale-[1.01]"
            : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground neon-glow"
        }`}
      >
        {/* shimmer enquanto copia */}
        {copyState === "copying" && (
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent"
            style={{ animation: "shimmer-slide 0.9s ease-in-out infinite" }}
          />
        )}
        <span
          key={copyState}
          className="relative z-[1] inline-flex items-center gap-2"
          style={{ animation: "message-in 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          {copyState === "copying" && (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/70 border-t-transparent animate-spin" />
              COPIANDO…
            </>
          )}
          {copyState === "copied" && (
            <>
              <span className="text-[18px] leading-none">✓</span>
              COPIADO! COLE NO APP DO BANCO
            </>
          )}
          {copyState === "idle" && <>📋 COPIAR CÓDIGO PIX</>}
        </span>
      </button>

      <div className="rounded-2xl bg-online/15 border-2 border-online/50 px-3 py-2 flex items-start gap-2">
        <span className="shrink-0 h-6 w-6 rounded-full bg-online/30 border border-online flex items-center justify-center text-online text-[14px] font-bold">
          ✓
        </span>
        <p className="text-[12px] sm:text-[13px] text-foreground font-semibold leading-snug">
          Liberação <span className="text-online">automática</span> assim que o Pix cair.{" "}
          <span className="text-muted-foreground font-medium">O link do grupo abre aqui mesmo.</span>
        </p>
      </div>

      <CtaButton onClick={handleCheckNow} disabled={checking}>
        {checking ? "VERIFICANDO…" : "JÁ PAGUEI ✅"}
      </CtaButton>

      <details className="rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-2 text-left">
        <summary className="text-[11px] font-bold text-amber-200 cursor-pointer">
          ⚠️ Nome do recebedor pode aparecer diferente
        </summary>
        <p className="mt-1.5 text-[10.5px] text-amber-100/90 leading-snug">
          O Pix é processado por gateway seguro (ex: SyncPay, Mercado Pago).
          Se seu banco alertar, confirme e finalize normalmente. 🔒
        </p>
      </details>

      <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
        🔒 Liberação <strong className="text-foreground">100% automática</strong> · gateway certificado
      </p>
    </div>
  );
}
