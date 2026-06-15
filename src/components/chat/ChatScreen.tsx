import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { Plan, PlanCard } from "./PlanCard";

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

type Step = 1 | 2 | 3;

const PLANS: Plan[] = [
  {
    id: "vital",
    title: "🔥 Acesso Vitalício — 500+ Mídias",
    price: "R$ 12,90",
    oldPrice: "R$ 49,90",
    badge: "MAIS ESCOLHIDO",
    highlight: true,
  },
  {
    id: "week",
    title: "🟢 Acesso por 7 dias",
    price: "R$ 6,90",
    oldPrice: "R$ 19,90",
  },
];

const VIP_ACCESS_URL = "https://t.me/+0ApNmK8IQSFmNDRh";

export function ChatScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [stage1, setStage1] = useState(0);
  const [stage2, setStage2] = useState(0);
  const [vipLink, setVipLink] = useState<string>(VIP_ACCESS_URL);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ETAPA 1 — Intro + Planos
  useEffect(() => {
    if (step !== 1) return;
    setStage1(0);
    const timers = [300, 900, 1200, 1900, 2500, 3100, 3600, 3900, 4500, 4800].map(
      (ms, i) => setTimeout(() => setStage1(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ETAPA 2 — Confirmação do plano + PIX
  useEffect(() => {
    if (step !== 2) return;
    setStage2(0);
    const timers = [150, 600, 1100, 1700, 2400, 3200].map(
      (ms, i) => setTimeout(() => setStage2(i + 1), ms)
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
  }, [step, stage1, stage2]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-2 sm:pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">

          {/* ETAPA 1 — INTRO + PLANOS */}
          {step === 1 && (
            <>
              <p className="text-center text-[11px] text-muted-foreground mb-1.5">
                Hotflix🔥 — Acesso exclusivo
              </p>

              {stage1 < 1 && <TypingBubble />}
              {stage1 >= 1 && (
                <Bubble delay={0}>Oi! Tô aqui esperando você 🔥</Bubble>
              )}

              {stage1 >= 1 && stage1 < 3 && <TypingBubble />}
              {stage1 >= 3 && (
                <Bubble delay={0}>
                  Tenho um acesso especial reservado — coisa que não libero pra qualquer um
                </Bubble>
              )}

              {stage1 >= 3 && stage1 < 5 && <TypingBubble />}
              {stage1 >= 5 && (
                <Bubble delay={0}>
                  Você veio do lugar certo. Deixa eu te mostrar o que tem aqui dentro 👇
                </Bubble>
              )}

              {stage1 >= 7 && (
                <Bubble from="me" delay={0}>Quero ver!</Bubble>
              )}

              {stage1 >= 7 && stage1 < 9 && <TypingBubble />}
              {stage1 >= 9 && (
                <Bubble delay={0}>
                  Perfeito. Olha só o que você vai acessar agora:
                </Bubble>
              )}

              {stage1 >= 10 && (
                <div
                  className="space-y-4"
                  style={{
                    animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <p className="text-[15px] text-foreground text-center font-medium">
                    Escolhe o acesso que faz mais sentido pra você:
                  </p>
                  {PLANS.map((p, i) => (
                    <PlanCard
                      key={p.id}
                      plan={p}
                      selected={selectedPlan.id === p.id}
                      onSelect={() => {
                        setSelectedPlan(p);
                        setStep(2);
                      }}
                      delay={i * 100}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ETAPA 2 — CONFIRMAÇÃO + PIX */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-[12px] text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1 py-1 px-1 -ml-1 active:scale-95 transition"
              >
                ← voltar
              </button>

              {stage2 >= 1 && (
                <Bubble from="me" delay={0}>
                  Escolhi: {selectedPlan.title}
                </Bubble>
              )}

              {stage2 >= 1 && stage2 < 3 && <TypingBubble />}
              {stage2 >= 3 && (
                <Bubble delay={0}>
                  Fechado. Vou gerar seu Pix agora…
                </Bubble>
              )}

              {stage2 >= 3 && stage2 < 5 && <TypingBubble />}
              {stage2 >= 5 && (
                <Bubble delay={0}>
                  Gerou o Pix! É só copiar o código e pagar no app do banco. Assim que cair, o acesso abre aqui mesmo 🔒
                </Bubble>
              )}

              {stage2 >= 6 && (
                <Suspense fallback={<LazyFallback />}>
                  <PixDirect
                    plan={selectedPlan}
                    onPaid={(inviteLink) => {
                      if (inviteLink) setVipLink(inviteLink);
                      setStep(3);
                    }}
                  />
                </Suspense>
              )}
            </>
          )}

          {/* ETAPA 3 — Sucesso */}
          {step === 3 && (
            <div className="pt-2">
              <Suspense fallback={<LazyFallback />}>
                <PaymentSuccess
                  telegramUrl={vipLink}
                  planTitle={selectedPlan.title}
                />
                <Testimonials />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
