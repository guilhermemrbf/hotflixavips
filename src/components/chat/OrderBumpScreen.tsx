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
      className="space-y-4 px-0.5 pb-[calc(7.5rem+env(safe-area-inset-bottom))]"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 py-1 -ml-1"
      >
        ← trocar plano
      </button>

      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-destructive/20 text-destructive px-3 py-1.5 rounded-full mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          Ultima chance · expira em <span className="tabular-nums">{mm}:{ss}</span>
        </span>
        <h2 className="text-[21px] sm:text-[24px] leading-[1.15] font-extrabold text-foreground px-1">
          Espera...{" "}
          <span className="text-gradient">separei algo especial só pra você</span> 😈
        </h2>
        <p className="text-[13px] text-muted-foreground mt-2 leading-snug">
          Libero isso <strong className="text-foreground">uma unica vez</strong>. Se sair, nao volta.
        </p>
      </div>

      {/* Prévia bloqueada do pack */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-primary/40 aspect-[16/10] bg-gradient-to-br from-primary/20 via-black to-black">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
          <div className="h-14 w-14 rounded-full bg-black/60 border border-primary/60 flex items-center justify-center neon-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7 text-primary">
              <rect x="4" y="10" width="16" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Conteúdo bloqueado
          </p>
          <p className="text-[12px] text-muted-foreground">
            Desbloqueie abaixo pra ver tudo 👇
          </p>
        </div>
      </div>

      {/* Order Bump Card - Principal */}
      <button
        type="button"
        onClick={() => setWithBump((v) => !v)}
        className={`w-full text-left rounded-3xl p-4 sm:p-5 border-2 transition-all duration-200 relative overflow-hidden active:scale-[0.99] ${
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

        <div className="flex items-start gap-3 mt-4">
          <div
            className={`shrink-0 mt-0.5 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition ${
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
                className="h-4.5 w-4.5"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              SIM, adicionar ao meu pedido
            </p>
            <h3 className="text-[17px] sm:text-[18px] font-extrabold text-foreground leading-tight mt-0.5">
              🎁 Pack Secreto da Leticia
            </h3>
            <p className="text-[12.5px] text-muted-foreground mt-1.5 leading-snug">
              Meus videos mais ousados que eu{" "}
              <strong className="text-foreground">
                nunca postei em grupo nenhum
              </strong>
              . Coisa que fica so entre a gente. 😈
            </p>

            <ul className="mt-3 space-y-1.5">
              {[
                "Videos inéditos só pra quem pega agora",
                "Conteudo +18 sem censura",
                "Liberado junto com o seu acesso",
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-[12.5px] text-foreground/90"
                >
                  <span className="text-online mt-0.5 shrink-0">✓</span>
                  <span className="leading-snug">{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 mt-3">
              <span className="text-xs text-muted-foreground line-through">
                R$ 23,90
              </span>
              <span className="text-[22px] sm:text-2xl font-extrabold text-gradient">
                + {formatBRL(BUMP_PRICE_CENTS)}
              </span>
              <span className="text-[11px] text-muted-foreground w-full sm:w-auto">
                no mesmo Pix
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Resumo do pedido */}
      <div className="rounded-2xl bg-card/80 border border-border p-4 space-y-2.5 backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Resumo do pedido
        </p>
        <div className="flex justify-between text-[13px]">
          <span className="text-foreground/90 truncate pr-2">{plan.title}</span>
          <span className="text-foreground font-semibold shrink-0">
            {formatBRL(planCents)}
          </span>
        </div>
        {withBump && (
          <div
            className="flex justify-between text-[13px]"
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
        <div className="border-t border-border pt-2.5 flex justify-between items-baseline">
          <span className="text-[13px] text-muted-foreground font-semibold">
            Total via Pix
          </span>
          <span className="text-[26px] font-extrabold text-gradient tabular-nums">
            {formatBRL(totalCents)}
          </span>
        </div>
      </div>

      {/* Social proof */}
      <div className="rounded-2xl bg-online/10 border border-online/30 p-3 text-center">
        <p className="text-[12px] text-foreground leading-snug">
          🔥 <strong>9 em cada 10</strong> homens que chegam aqui levam o{" "}
          <strong className="text-primary">Pack Secreto junto</strong>. Nao e a
          toa.
        </p>
      </div>

      {/* Sticky CTA — última chamada fixa no mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background/95 to-background/0 backdrop-blur-md"
        style={{ animation: "message-in 0.4s ease both" }}
      >
        <div className="mx-auto w-full max-w-md sm:max-w-lg">
          <CtaButton onClick={() => onConfirm(withBump)}>
            {withBump
              ? `PAGAR ${formatBRL(totalCents)} COM BONUS 🔥`
              : `PAGAR ${formatBRL(totalCents)} AGORA 🔥`}
          </CtaButton>
          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <span>🔒 Pix seguro</span>
            <span>·</span>
            <span>Liberação automática</span>
            <span>·</span>
            <span>100% sigiloso</span>
          </div>
        </div>
      </div>
    </div>
  );
}
