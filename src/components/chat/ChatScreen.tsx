import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { CtaButton } from "./CtaButton";
import { Plan, PlanCard } from "./PlanCard";

// Code-splitting: telas pesadas só carregam quando necessário,
// reduzindo drasticamente o JS inicial.
const VslScreen = lazy(() =>
  import("./VslScreen").then((m) => ({ default: m.VslScreen })),
);
const OrderBumpScreen = lazy(() =>
  import("./OrderBumpScreen").then((m) => ({ default: m.OrderBumpScreen })),
);
const PixDirect = lazy(() =>
  import("./PixDirect").then((m) => ({ default: m.PixDirect })),
);
const PaymentSuccess = lazy(() =>
  import("./PaymentSuccess").then((m) => ({ default: m.PaymentSuccess })),
);
const Testimonials = lazy(() =>
  import("./Testimonials").then((m) => ({ default: m.Testimonials })),
);

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

type Step = 1 | "vsl" | 2 | 3 | 4 | 5 | 6;

const STEP_ORDER: Record<Step, number> = {
  1: 1,
  vsl: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
};

const PLANS: Plan[] = [
  {
    id: "vital",
    title: "🥇 Vitalício + 500 Mídias 🔥",
    price: "R$ 12,90",
    oldPrice: "R$ 49,90",
    badge: "MAIS ESCOLHIDO 🔥",
    highlight: true,
  },
  {
    id: "bonus",
    title: "💎 Vitalício + Pack Secreto",
    description:
      "Acesso vitalicio + pack bonus de videos exclusivos que eu nao libero pra todo mundo",
    price: "R$ 8,90",
    oldPrice: "R$ 29,90",
  },
  {
    id: "videocall",
    title: "📹 CHAMADA DE VÍDEO",
    description: "30 minutos ao vivo comigo, só você e eu",
    price: "R$ 22,90",
    oldPrice: "R$ 79,90",
    badge: "EXCLUSIVO 😈",
    highlight: true,
  },
  {
    id: "week",
    title: "🟢 1 SEMANA 🟢",
    price: "R$ 6,90",
    oldPrice: "R$ 19,90",
  },
];

const VIP_ACCESS_URL = "https://t.me/+0ApNmK8IQSFmNDRh";

function hasReached(current: Step, target: Step) {
  return STEP_ORDER[current] >= STEP_ORDER[target];
}

export function ChatScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [withBump, setWithBump] = useState(false);
  const [stage1, setStage1] = useState(0);
  const [stage2, setStage2] = useState(0);
  const [stage3, setStage3] = useState(0);
  const [vipLink, setVipLink] = useState<string>(VIP_ACCESS_URL);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reachedVsl = hasReached(step, "vsl");
  const reachedPlans = hasReached(step, 3);
  const reachedBump = hasReached(step, 4);
  const reachedPix = hasReached(step, 5);
  const reachedSuccess = hasReached(step, 6);
  const stage1Visible = step === 1 ? stage1 : 3;
  const stage2Visible = step === 2 ? stage2 : reachedPlans ? 4 : 0;
  const stage3Visible = step === 3 ? stage3 : reachedBump ? 2 : 0;

  // Warm-up leve: apenas o poster e o chunk JS da VSL enquanto o usuário
  // lê o chat. O VÍDEO (6MB) só baixa quando ele clicar em QUERO VER —
  // isso reduz muito o uso de banda no carregamento inicial.
  useEffect(() => {
    if (step !== 1) return;
    const img = new Image();
    img.src = "/vsl-poster.jpg";
    // Pré-importa o chunk da VSL em idle (sem bloquear)
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 800));
    idle(() => {
      import("./VslScreen").catch(() => {});
    });
  }, [step]);

  // ETAPA 1
  useEffect(() => {
    if (step !== 1) return;
    setStage1(0);
    const timers = [300, 1100, 2000].map((ms, i) =>
      setTimeout(() => setStage1(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ETAPA 2 legada
  useEffect(() => {
    if (step !== 2) return;
    setStage2(0);
    const timers = [150, 1100, 2000, 2800].map((ms, i) =>
      setTimeout(() => setStage2(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ETAPA 3
  useEffect(() => {
    if (step !== 3) return;
    setStage3(0);
    const timers = [300, 1000].map((ms, i) =>
      setTimeout(() => setStage3(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [step, stage1, stage2, stage3, selectedPlan.id, withBump]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-2 sm:pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-[10.5px] text-muted-foreground mb-1.5">
            Letícia • Hotflix — Acesso exclusivo
          </p>

          {stage1Visible < 1 ? (
            <TypingBubble />
          ) : (
            <Bubble delay={0}>Oii amor... tava te esperando 🔥</Bubble>
          )}
          {stage1Visible >= 1 && stage1Visible < 2 && <TypingBubble />}
          {stage1Visible >= 2 && (
            <Bubble delay={0}>
              Tenho um <strong>acesso privado</strong> esperando voce — coisa
              que eu nao mando pra qualquer um
            </Bubble>
          )}
          {stage1Visible >= 3 && step === 1 && (
            <div
              className="mt-4 text-center"
              style={{
                animation:
                  "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
              }}
            >
              <p className="text-[18px] sm:text-[22px] leading-tight font-extrabold text-foreground">
                ⚠️ Só quem chegou aqui{" "}
                <span className="text-gradient">pode ver.</span>
              </p>
              <div className="mt-3">
                <CtaButton delay={0} onClick={() => setStep("vsl")}>
                  QUERO VER 🔥
                </CtaButton>
                <p className="mt-1.5 text-[10.5px] text-muted-foreground">
                  Grátis pra ver • Sem cadastro
                </p>
              </div>
            </div>
          )}

          {reachedVsl && (
            <>
              <Bubble from="me" delay={0}>
                Quero ver 🔥
              </Bubble>

              {step === "vsl" && (
                <Suspense fallback={<LazyFallback />}>
                  <VslScreen onContinue={() => setStep(3)} />
                </Suspense>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {stage2Visible < 1 ? <TypingBubble /> : null}
              {stage2Visible >= 2 && (
                <Bubble delay={0}>
                  Isso é só uma previa... lá dentro vai{" "}
                  <strong>muito além</strong> 🔥
                </Bubble>
              )}
              {stage2Visible >= 3 && (
                <div
                  className="mt-4"
                  style={{
                    animation:
                      "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <CtaButton delay={0} onClick={() => setStep(3)}>
                    LIBERAR MEU ACESSO 🔥
                  </CtaButton>
                </div>
              )}
            </>
          )}

          {reachedPlans && (
            <>
              <Bubble from="me" delay={0}>
                Vi a prévia, quero liberar meu acesso
              </Bubble>

              <div
                className="text-center mb-3"
                style={{
                  animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full mb-2">
                  Acesso Liberado
                </span>
                <h2 className="text-[17px] sm:text-[22px] leading-tight font-extrabold text-foreground">
                  🔥 Escolhe seu acesso agora —{" "}
                  <span className="text-gradient">esse preco nao vai durar</span>
                </h2>
                <p className="mt-1.5 text-[12px] font-semibold text-primary">
                  Você vai entrar no 🔥 Club Proibido - Hotflix
                </p>
              </div>

              {stage3Visible >= 1 && step === 3 && (
                <div
                  className="space-y-2"
                  style={{
                    animation:
                      "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  {PLANS.map((p, i) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      selected={selectedPlan.id === p.id}
                      onSelect={() => {
                        setSelectedPlan(p);
                        setTimeout(() => setStep(4), 280);
                      }}
                      delay={i * 100}
                    />
                  ))}
                </div>
              )}

              {stage3Visible >= 2 && step === 3 && <UrgencyNotice />}

              {reachedBump && (
                <Bubble from="me" delay={0}>
                  Escolhi: {selectedPlan.title}
                </Bubble>
              )}
            </>
          )}

          {step === 4 && (
            <Suspense fallback={<LazyFallback />}>
              <OrderBumpScreen
                plan={selectedPlan}
                onBack={() => setStep(3)}
                onConfirm={(bump) => {
                  setWithBump(bump);
                  setStep(5);
                }}
              />
            </Suspense>
          )}

          {reachedPix && (
            <Bubble from="me" delay={0}>
              {withBump
                ? "Quero adicionar o Pack Secreto 🎁"
                : "Vou seguir sem o bônus"}
            </Bubble>
          )}

          {step === 5 && (
            <>
              <button
                onClick={() => setStep(4)}
                className="text-[11px] text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1 py-1 px-1 -ml-1 active:scale-95 transition"
              >
                ← voltar
              </button>
              <Suspense fallback={<LazyFallback />}>
                <PixDirect
                  plan={selectedPlan}
                  withBump={withBump}
                  onPaid={(inviteLink) => {
                    if (inviteLink) setVipLink(inviteLink);
                    setStep(6);
                  }}
                />
              </Suspense>
            </>
          )}

          {reachedSuccess && (
            <>
              <Bubble from="me" delay={0}>
                Pagamento confirmado ✅
              </Bubble>
              <div className="pt-2">
                <Suspense fallback={<LazyFallback />}>
                  <PaymentSuccess
                    telegramUrl={vipLink}
                    planTitle={selectedPlan.title}
                  />
                  <Testimonials />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UrgencyNotice() {
  const [seconds, setSeconds] = useState(15 * 60);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div
      className="mt-5 rounded-2xl bg-destructive/20 border border-destructive/50 px-4 py-3 text-center"
      style={{
        animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <p className="text-[13px] text-foreground font-semibold leading-snug">
        🚨 Preco promocional por tempo limitado. Pode subir a qualquer momento.
      </p>
      <p className="mt-1.5 font-mono text-base font-extrabold text-destructive tabular-nums">
        {mm}:{ss}
      </p>
    </div>
  );
}
