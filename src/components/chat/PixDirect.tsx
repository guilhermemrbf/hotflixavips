import { useEffect, useRef, useState } from "react";
import type { Plan } from "./PlanCard";
import { captureUtms } from "@/lib/utms";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  plan: Plan;
  onPaid: (inviteLink?: string | null) => void;
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
  const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">("idle");
  const [checking, setChecking] = useState(false);
  const createdForPlanRef = useRef<string | null>(null);

  useEffect(() => {
    const key = plan.id;
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
          body: JSON.stringify({ plan_id: plan.id, utms, bump: false }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          console.error("create-pix error", data);
          setError("Falha ao gerar Pix. Tenta de novo em instantes.");
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
  }, [plan.id]);

  useEffect(() => {
    if (!pix || seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [pix, seconds]);

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
          onPaid(data?.telegram_invite_link ?? null);
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
      if (data?.status === "paid") onPaid(data?.telegram_invite_link ?? null);
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
        <button
          onClick={() => location.reload()}
          className="w-full rounded-full px-5 py-3 font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.97] bg-gradient-to-r from-primary to-primary-glow text-primary-foreground neon-glow hover:scale-[1.02] animate-pulse-glow"
        >
          TENTAR DE NOVO
        </button>
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
      className="space-y-3 px-0.5"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <div className="text-center space-y-1">
        <h2 className="text-[18px] sm:text-xl font-extrabold text-foreground leading-tight">
          Quase lá! Só falta pagar o Pix 👇
        </h2>
        <p className="text-[12px] text-muted-foreground tabular-nums">
          Expira em <span className="text-foreground font-semibold">{mm}:{ss}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 text-center">
        <div className="mx-auto h-44 w-44 sm:h-52 sm:w-52 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code Pix"
              className="h-full w-full object-contain"
            />
          ) : pix.pix_copy_paste ? (
            <QRCodeSVG
              value={pix.pix_copy_paste}
              size={180}
              level="M"
              className="h-full w-full"
            />
          ) : (
            <p className="text-xs text-black">
              QR Code indisponível — use o código abaixo
            </p>
          )}
        </div>
        <p className="text-[18px] sm:text-lg text-foreground mt-3 font-extrabold">
          {totalLabel} <span className="text-muted-foreground font-medium text-[13px]">via Pix</span>
        </p>
      </div>

      <button
        onClick={handleCopy}
        disabled={!pix.pix_copy_paste || copyState === "copying"}
        aria-live="polite"
        className={`relative w-full overflow-hidden rounded-2xl px-4 py-4 text-[15px] font-extrabold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] ${
          copyState === "copied"
            ? "bg-online/20 border-2 border-online text-online scale-[1.01]"
            : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground neon-glow"
        }`}
      >
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

      <div className="rounded-2xl bg-online/15 border-2 border-online/60 px-4 py-3 flex items-center gap-3 neon-glow">
        <span className="shrink-0 h-9 w-9 rounded-full bg-online/30 border border-online flex items-center justify-center text-online text-[18px] font-bold">
          ✓
        </span>
        <p className="text-[15px] sm:text-[16px] text-foreground font-extrabold leading-snug">
          Liberação <span className="text-online">automática</span> assim que o Pix cair
          <span className="block text-[12px] font-medium text-muted-foreground mt-0.5">
            O link do grupo abre aqui mesmo.
          </span>
        </p>
      </div>

      <div className="rounded-2xl bg-card/60 border border-border p-4">
        <p className="text-[12px] font-bold uppercase tracking-wider text-primary text-center mb-3">
          Como pagar em 30 segundos
        </p>
        <ol className="space-y-2">
          {[
            "Abre o app do seu banco",
            "Escolhe pagar com Pix · Copia e Cola",
            "Cola o código e confirma o valor",
            "Pronto — acesso liberado 🔥",
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5 items-center">
              <span className="shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-[12px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[14px] text-foreground/90 leading-snug">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={handleCheckNow}
        disabled={checking}
        className="w-full rounded-full px-5 py-4 font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.97] bg-gradient-to-r from-primary to-primary-glow text-primary-foreground neon-glow hover:scale-[1.02] animate-pulse-glow disabled:opacity-60"
      >
        {checking ? "VERIFICANDO…" : "JÁ PAGUEI ✅"}
      </button>
    </div>
  );
}
