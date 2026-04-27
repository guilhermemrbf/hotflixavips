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
      className="space-y-5 px-1 pb-2"
      style={{ animation: "message-in 0.5s ease both" }}
    >
      <button
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
      >
        ← trocar plano
      </button>

      {/* Header */}
      <div className="text-center">
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-destructive/20 text-destructive px-3 py-1 rounded-full mb-3 animate-pulse-glow">
          ⚠️ Ultima chance · expira em {mm}:{ss}
        </span>
        <h2 className="text-[22px] sm:text-[24px] leading-tight font-extrabold text-foreground">
          Antes de voce entrar...{" "}
          <span className="text-gradient">tenho algo so pra voce</span> 😈
        </h2>
        <p className="text-sm text-muted-foreground mt-2 leading-snug">
          Libero isso uma unica vez. Se sair, nao volta.
        </p>
      </div>

      {/* Order Bump Card - Principal */}
      <button
        type="button"
        onClick={() => setWithBump((v) => !v)}
        className={`w-full text-left rounded-3xl p-5 border-2 transition-all duration-200 relative overflow-hidden active:scale-[0.99] ${
          withBump
            ? "border-primary bg-gradient-to-br from-primary/20 via-card to-card neon-glow"
            : "border-border bg-card"
        }`}
      >
        <div className="absolute -top-px right-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-b-lg bg-gradient-to-r from-destructive to-primary text-white shadow-lg">
            🔥 83% OFF · SÓ HOJE
          </span>
        </div>

        <div className="flex items-start gap-3 mt-3">
          <div
            className={`shrink-0 mt-1 h-6 w-6 rounded-md border-2 flex items-center justify-center transition ${
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
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              SIM, adicionar ao meu pedido
            </p>
            <h3 className="text-[18px] font-extrabold text-foreground leading-tight mt-0.5">
              🎁 Pack Secreto da Leticia
            </h3>
            <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">
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
                  className="flex items-start gap-2 text-[12px] text-foreground/90"
                >
                  <span className="text-online mt-0.5">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-xs text-muted-foreground line-through">
                R$ 23,90
              </span>
              <span className="text-2xl font-extrabold text-gradient">
                + {formatBRL(BUMP_PRICE_CENTS)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                no mesmo Pix
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Resumo do pedido */}
      <div className="rounded-2xl bg-card border border-border p-4 space-y-2.5">
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
          <span className="text-2xl font-extrabold text-gradient tabular-nums">
            {formatBRL(totalCents)}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-2.5">
        <CtaButton onClick={() => onConfirm(withBump)}>
          {withBump ? "GERAR PIX COM BONUS 🔥" : "GERAR PIX AGORA 🔥"}
        </CtaButton>

        <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">🔒 Pix seguro</span>
          <span>·</span>
          <span>Acesso automático</span>
          <span>·</span>
          <span>100% sigiloso</span>
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
    </div>
  );
}
