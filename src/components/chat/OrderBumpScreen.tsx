import { useEffect, useState } from "react";
import { CtaButton } from "./CtaButton";
import type { Plan } from "./PlanCard";

interface Props {
  plan: Plan;
  onConfirm: (withBump: boolean) => void;
  onBack: () => void;
}

const BUMP_PRICE_CENTS = 390;

function formatBRL(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function parseCents(price: string): number {
  // "R$ 12,90" -> 1290
  const n = price.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round(parseFloat(n) * 100);
}

export function OrderBumpScreen({ plan, onConfirm, onBack }: Props) {
  const [withBump, setWithBump] = useState(true);
  const [seconds, setSeconds] = useState(5 * 60);

  useEffect(() => {
    const t = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const planCents = parseCents(plan.price);
  const totalCents = planCents + (withBump ? BUMP_PRICE_CENTS : 0);

  return (
    <div
      className="space-y-2.5 px-0.5 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <button
        onClick={onBack}
        className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 py-0.5 -ml-1"
      >
        ← trocar plano
      </button>

      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-widest bg-destructive/20 text-destructive px-2.5 py-1 rounded-full mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Ultima chance · expira em <span className="tabular-nums">{mm}:{ss}</span>
        </span>
        <h2 className="text-[17px] sm:text-[22px] leading-[1.15] font-extrabold text-foreground px-1">
          Espera...{" "}
          <span className="text-gradient">separei algo especial só pra você</span> 😈
        </h2>
        <p className="text-[12px] text-muted-foreground mt-1.5 leading-snug">
          Libero isso <strong className="text-foreground">uma unica vez</strong>. Se sair, nao volta.
        </p>
      </div>

      {/* Prévia bloqueada do pack */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary/40 aspect-[16/7] bg-gradient-to-br from-primary/20 via-black to-black">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(139,92,246,0.35), transparent 55%), radial-gradient(circle at 70% 70%, rgba(236,72,153,0.3), transparent 55%)",
            filter: "blur(32px)",
          }}
        />
        <div className="absolute inset-0 backdrop-blur-2xl bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-4">
          <div className="h-10 w-10 rounded-full bg-black/60 border border-primary/60 flex items-center justify-center neon-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-primary">
              <rect x="4" y="10" width="16" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Conteúdo bloqueado
          </p>
        </div>
      </div>

      {/* Order Bump Card - Principal */}
      <button
        type="button"
        onClick={() => setWithBump((v) => !v)}
        className={`w-full text-left rounded-2xl p-3 sm:p-4 border-2 transition-all duration-200 relative overflow-hidden active:scale-[0.99] ${
          withBump
            ? "border-primary bg-gradient-to-br from-primary/20 via-card to-card neon-glow"
            : "border-border bg-card"
        }`}
      >
        <div className="absolute -top-px right-3 sm:right-4">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-b-lg bg-gradient-to-r from-destructive to-primary text-white shadow-lg">
            🔥 83% OFF · SÓ HOJE
          </span>
        </div>

        <div className="flex items-start gap-2.5 mt-3">
          <div
            className={`shrink-0 mt-0.5 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition ${
              withBump
                ? "bg-gradient-to-br from-primary to-primary-glow border-primary text-primary-foreground"
                : "border-muted-foreground/40 bg-transparent"
            }`}
          >
            {withBump && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="h-4 w-4"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              SIM, adicionar ao meu pedido
            </p>
            <h3 className="text-[15px] sm:text-[17px] font-extrabold text-foreground leading-tight mt-0.5">
              🎁 Pack Secreto • Hotflix
            </h3>
            <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug">
              Meus videos mais ousados, que{" "}
              <strong className="text-foreground">só libero aqui</strong>. 😈
            </p>

            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-2">
              <span className="text-[11px] text-muted-foreground line-through">
                R$ 23,90
              </span>
              <span className="text-[18px] sm:text-2xl font-extrabold text-gradient">
                + {formatBRL(BUMP_PRICE_CENTS)}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Resumo do pedido */}
      <div className="rounded-2xl bg-card/80 border border-border px-3 py-2.5 space-y-1.5 backdrop-blur-sm">
        <div className="flex justify-between text-[12px]">
          <span className="text-foreground/90 truncate pr-2">{plan.title}</span>
          <span className="text-foreground font-semibold shrink-0">
            {formatBRL(planCents)}
          </span>
        </div>
        {withBump && (
          <div
            className="flex justify-between text-[12px]"
            style={{ animation: "message-in 0.3s ease both" }}
          >
            <span className="text-primary truncate pr-2">
              + Pack Secreto 🎁
            </span>
            <span className="text-primary font-semibold shrink-0">
              {formatBRL(BUMP_PRICE_CENTS)}
            </span>
          </div>
        )}
        <div className="border-t border-border pt-1.5 flex justify-between items-baseline">
          <span className="text-[12px] text-muted-foreground font-semibold">
            Total via Pix
          </span>
          <span className="text-[22px] font-extrabold text-gradient tabular-nums">
            {formatBRL(totalCents)}
          </span>
        </div>
      </div>

      {/* Sticky CTA — última chamada fixa no mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background/95 to-background/0 backdrop-blur-md"
        style={{ animation: "message-in 0.4s ease both" }}
      >
        <div className="mx-auto w-full max-w-sm sm:max-w-md">
          <CtaButton onClick={() => onConfirm(withBump)}>
            {withBump
              ? `PAGAR ${formatBRL(totalCents)} COM BONUS 🔥`
              : `PAGAR ${formatBRL(totalCents)} AGORA 🔥`}
          </CtaButton>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-[9.5px] text-muted-foreground">
            <span>🔒 Pix seguro</span>
            <span>·</span>
            <span>100% sigiloso</span>
          </div>
        </div>
      </div>
    </div>
  );
}
