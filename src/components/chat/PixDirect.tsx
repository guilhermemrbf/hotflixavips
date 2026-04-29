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
      <div className="text-center space-y-1">
        <h2 className="text-[17px] sm:text-xl font-extrabold text-foreground leading-tight">
          Falta <span className="text-gradient">1 passo</span> pra entrar
        </h2>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          Expira em <span className="text-foreground font-semibold">{mm}:{ss}</span>
        </p>
      </div>

      {/* Faixa de comentários animados — prova social compacta */}
      <div className="relative overflow-hidden rounded-xl bg-card/50 border border-border py-1.5">
        <div
          className="flex gap-2 whitespace-nowrap w-max"
          style={{ animation: "marquee-left 38s linear infinite" }}
        >
          {(() => {
            const items = [
              { n: "Carlos M.", t: "Caiu na hora, já tô dentro 🔥" },
              { n: "Rafa", t: "Liberou em 3s, surreal 😱" },
              { n: "Bruno", t: "Paguei e já entrei no grupo ✅" },
              { n: "Diego", t: "Vale demais o valor 🔥🔥" },
              { n: "Lucas", t: "Funcionou de primeira 👏" },
              { n: "Pedro", t: "Conteúdo absurdo, recomendo 💯" },
              { n: "Thiago", t: "Pix automático mesmo, sensacional" },
              { n: "Mateus", t: "Tava com medo mas é real ✅" },
            ];
            const loop = [...items, ...items];
            return loop.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-bubble-her border border-online/30 px-2.5 py-1 text-[11px] text-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse-ring" />
                <span className="font-semibold text-online/90">{c.n}:</span>
                <span className="text-foreground/90">{c.t}</span>
              </span>
            ));
          })()}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>

      <div className="rounded-2xl bg-card border border-border p-3 text-center">
        <div className="mx-auto h-40 w-40 sm:h-44 sm:w-44 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt="QR Code Pix"
              className="h-full w-full object-contain"
            />
          ) : pix.pix_copy_paste ? (
            <QRCodeSVG
              value={pix.pix_copy_paste}
              size={160}
              level="M"
              className="h-full w-full"
            />
          ) : (
            <p className="text-xs text-black">
              QR Code indisponível — use o código abaixo
            </p>
          )}
        </div>
        <p className="text-[16px] sm:text-lg text-foreground mt-2 font-extrabold">
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

      {/* Destaque: liberação automática — maior medo do comprador */}
      <div className="rounded-2xl bg-online/15 border-2 border-online/60 px-4 py-3 flex items-center gap-3 neon-glow">
        <span className="shrink-0 h-9 w-9 rounded-full bg-online/30 border border-online flex items-center justify-center text-online text-[18px] font-bold">
          ✓
        </span>
        <p className="text-[14px] sm:text-[15px] text-foreground font-extrabold leading-snug">
          Liberação <span className="text-online">automática</span> assim que o Pix cair
          <span className="block text-[11px] font-medium text-muted-foreground mt-0.5">
            O link do grupo abre aqui mesmo.
          </span>
        </p>
      </div>

      {/* Passo a passo — público menos tech */}
      <div className="rounded-2xl bg-card/60 border border-border p-3">
        <p className="text-[10.5px] font-bold uppercase tracking-wider text-primary text-center mb-2">
          Como pagar em 30 segundos
        </p>
        <ol className="space-y-1.5">
          {[
            "Abre o app do seu banco",
            "Escolhe pagar com Pix · Copia e Cola",
            "Cola o código e confirma o valor",
            "Pronto — acesso liberado 🔥",
          ].map((t, i) => (
            <li key={i} className="flex gap-2.5 items-center">
              <span className="shrink-0 h-5 w-5 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-[12.5px] text-foreground/90 leading-snug">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      <CtaButton onClick={handleCheckNow} disabled={checking}>
        {checking ? "VERIFICANDO…" : "JÁ PAGUEI ✅"}
      </CtaButton>

      {/* Aviso sobre nome diferente — elimina abandono por desconfiança */}
      <details className="rounded-xl bg-amber-500/10 border border-amber-500/40 px-3 py-2 text-left">
        <summary className="text-[11px] font-bold text-amber-200 cursor-pointer list-none flex items-center justify-between gap-2">
          <span>⚠️ Nome do recebedor vai aparecer diferente — é normal</span>
          <span className="text-amber-200/70 text-[10px]">ver</span>
        </summary>
        <p className="mt-2 text-[11px] text-amber-100/90 leading-snug">
          O Pix é processado por uma <strong>processadora segura</strong> (ex: SyncPay, Mercado Pago).
          Vai aparecer o nome da empresa em vez do meu — isso protege a sua identidade e a minha. 🔒
        </p>
        <p className="mt-1.5 text-[11px] text-amber-100/90 leading-snug">
          Se o banco mostrar alerta, <strong>pode confirmar e finalizar tranquilo</strong> — é só aviso de primeiro pagamento.
        </p>
      </details>
    </div>
  );
}
