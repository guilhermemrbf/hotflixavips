import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { CtaButton } from "./CtaButton";
import { Plan, PlanCard } from "./PlanCard";
import { PixDirect } from "./PixDirect";
import { PaymentSuccess } from "./PaymentSuccess";
import { Testimonials } from "./Testimonials";
import leticiaPreview from "@/assets/leticia-preview.jpg";

type Step = 1 | 2 | 3 | 4 | 5;

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
    id: "week",
    title: "🟢 1 SEMANA 🟢",
    price: "R$ 6,90",
    oldPrice: "R$ 19,90",
  },
  {
    id: "videocall",
    title: "📹 CHAMADA DE VÍDEO",
    price: "R$ 22,90",
    oldPrice: "R$ 79,90",
    badge: "EXCLUSIVO 😈",
    highlight: true,
  },
];

const VIP_ACCESS_URL = "https://t.me/+0ApNmK8IQSFmNDRh";

export function ChatScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [stage1, setStage1] = useState(0);
  const [stage2, setStage2] = useState(0);
  const [stage3, setStage3] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ETAPA 1
  useEffect(() => {
    if (step !== 1) return;
    setStage1(0);
    const timers = [400, 1300, 2300, 3200].map((ms, i) =>
      setTimeout(() => setStage1(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ETAPA 2
  useEffect(() => {
    if (step !== 2) return;
    setStage2(0);
    const timers = [200, 1400, 2300, 3400, 4300, 5400, 6300, 7200].map(
      (ms, i) => setTimeout(() => setStage2(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // ETAPA 3
  useEffect(() => {
    if (step !== 3) return;
    setStage3(0);
    const timers = [300, 1000].map((ms, i) =>
      setTimeout(() => setStage3(i + 1), ms)
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
  }, [step, stage1, stage2, stage3]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-3 sm:pt-5 pb-[max(6rem,env(safe-area-inset-bottom))]">
          {/* ETAPA 1 */}
          {step === 1 && (
            <>
              <div className="text-center mb-3">
                <span className="text-[11px] text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                  hoje
                </span>
              </div>

              {stage1 < 1 ? (
                <TypingBubble />
              ) : (
                <Bubble delay={0}>Oii... tava pensando em voce</Bubble>
              )}
              {stage1 >= 1 && stage1 < 2 && <TypingBubble />}
              {stage1 >= 2 && (
                <Bubble delay={0}>
                  Separei uma coisa especial so pra quem chegou aqui
                </Bubble>
              )}
              {stage1 >= 2 && stage1 < 3 && <TypingBubble />}
              {stage1 >= 3 && (
                <Bubble delay={0}>
                  Tenho um <strong>acesso privado</strong> esperando voce — coisa
                  que eu nao mando pra qualquer um
                </Bubble>
              )}

              {stage1 >= 4 && (
                <div
                  className="mt-7 text-center"
                  style={{
                    animation:
                      "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <p className="text-[20px] sm:text-[22px] leading-tight font-extrabold text-foreground">
                    ⚠️ Só quem chegou aqui{" "}
                    <span className="text-gradient">pode ver.</span>
                  </p>
                  <div className="mt-5">
                    <CtaButton delay={0} onClick={() => setStep(2)}>
                      QUERO VER 🔥
                    </CtaButton>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ETAPA 2 */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-muted-foreground hover:text-primary mb-4 flex items-center gap-1"
              >
                ← voltar
              </button>

              {stage2 < 1 ? (
                <TypingBubble />
              ) : (
                <div
                  className="flex justify-start mb-3"
                  style={{
                    animation:
                      "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <div className="max-w-[82%] p-1.5 bg-bubble-her rounded-[1.25rem] rounded-bl-[0.25rem] shadow-soft">
                    <div className="relative rounded-2xl overflow-hidden border border-primary/40 neon-glow">
                      <img
                        src={leticiaPreview}
                        alt="Prévia exclusiva Letícia VIP"
                        className="w-full h-auto block"
                        loading="eager"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-2.5 py-1 rounded-full shadow-lg">
                          🔥 Prévia
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stage2 >= 1 && stage2 < 3 && <TypingBubble />}
              {stage2 >= 3 && (
                <Bubble delay={0}>
                  To te mandando uma <strong>previa</strong> so pra voce ter
                  uma ideia...
                </Bubble>
              )}

              {stage2 >= 3 && stage2 < 5 && <TypingBubble />}
              {stage2 >= 5 && (
                <Bubble delay={0}>
                  Isso e so o comeco. La dentro tem mais de{" "}
                  <strong>500 fotos e videos</strong> que eu nunca postei em
                  lugar nenhum.
                </Bubble>
              )}

              {stage2 >= 5 && stage2 < 7 && <TypingBubble />}
              {stage2 >= 7 && (
                <Bubble delay={0}>
                  Coisa que fica so entre a gente.
                </Bubble>
              )}

              {stage2 >= 8 && (
                <div
                  className="mt-6"
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

          {/* ETAPA 3 */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-muted-foreground hover:text-primary mb-4 flex items-center gap-1"
              >
                ← voltar
              </button>

              <div
                className="text-center mb-5"
                style={{
                  animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-3 py-1 rounded-full mb-3">
                  Acesso Liberado
                </span>
                <h2 className="text-[20px] sm:text-[22px] leading-tight font-extrabold text-foreground">
                  🔥 Escolhe seu acesso agora —{" "}
                  <span className="text-gradient">
                    esse preco nao vai durar
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Toca no plano e{" "}
                  <strong className="text-foreground">ja acessa tudo</strong>.
                </p>
              </div>

              {stage3 >= 1 && (
                <div
                  className="space-y-3"
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

              {stage3 >= 2 && (
                <UrgencyNotice />
              )}
            </>
          )}

          {/* ETAPA 4 */}
          {step === 4 && (
            <>
              <button
                onClick={() => setStep(3)}
                className="text-xs text-muted-foreground hover:text-primary mb-4 flex items-center gap-1"
              >
                ← trocar plano
              </button>
              <PixDirect plan={selectedPlan} onPaid={() => setStep(5)} />

              <div className="mt-5 rounded-2xl bg-destructive/10 border border-destructive/40 px-4 py-3 text-center">
                <p className="text-[13px] text-foreground font-medium leading-snug">
                  🚨 Promoção ativa{" "}
                  <strong className="text-primary">só agora</strong>. Se sair
                  da página pode perder.
                </p>
              </div>
            </>
          )}

          {/* ETAPA 5 */}
          {step === 5 && (
            <div className="pt-2">
              <PaymentSuccess
                telegramUrl={VIP_ACCESS_URL}
                planTitle={selectedPlan.title}
              />
              <Testimonials />
            </div>
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
      <p className="text-[13px] text-white font-semibold leading-snug">
        🚨 Preco promocional por tempo limitado. Pode subir a qualquer momento.
      </p>
      <p className="mt-1.5 font-mono text-base font-extrabold text-destructive tabular-nums">
        {mm}:{ss}
      </p>
    </div>
  );
}
