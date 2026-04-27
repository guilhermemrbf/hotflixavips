import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { CtaButton } from "./CtaButton";
import { Plan, PlanCard } from "./PlanCard";
import { PixDirect } from "./PixDirect";
import { PaymentSuccess } from "./PaymentSuccess";
import { Testimonials } from "./Testimonials";
import { OrderBumpScreen } from "./OrderBumpScreen";
import { VslScreen } from "./VslScreen";
import leticiaPreview from "@/assets/leticia-preview.jpg";

type Step = 1 | "vsl" | 2 | 3 | 4 | 5 | 6;

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

export function ChatScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [withBump, setWithBump] = useState(false);
  const [stage1, setStage1] = useState(0);
  const [stage2, setStage2] = useState(0);
  const [stage3, setStage3] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Preload da VSL assim que o usuário está na tela 1
  // — começa a baixar em background enquanto lê o chat.
  useEffect(() => {
    if (step !== 1) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = "/vsl.mp4";
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    // Prefetch do poster também
    const img = new Image();
    img.src = "/vsl-poster.jpg";
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [step]);

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
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-2 sm:pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* ETAPA 1 */}
          {step === 1 && (
            <>
              <p className="text-center text-[10.5px] text-muted-foreground mb-1.5">
                Letícia • Hotflix — Acesso exclusivo
              </p>

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
            </>
          )}

          {/* ETAPA VSL */}
          {step === "vsl" && (
            <VslScreen onContinue={() => setStep(2)} />
          )}

          {/* ETAPA 2 */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep("vsl")}
                className="text-[11px] text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1 py-1 px-1 -ml-1 active:scale-95 transition"
              >
                ← voltar
              </button>

              {stage2 < 1 ? (
                <TypingBubble />
              ) : (
                <div
                  className="flex justify-start mb-2"
                  style={{
                    animation:
                      "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <div className="max-w-[82%] p-1.5 bg-bubble-her rounded-[1.25rem] rounded-bl-[0.25rem] shadow-soft">
                    <div className="relative rounded-2xl overflow-hidden border border-primary/40 neon-glow">
                      <img
                        src={leticiaPreview}
                        alt="Prévia exclusiva Letícia • Hotflix"
                        className="w-full h-auto block max-h-[38dvh] object-cover"
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
                  Isso é só o que posso mostrar aqui fora. Lá dentro vai{" "}
                  <strong>muito além</strong> — e fica só entre a gente.
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

          {/* ETAPA 3 */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="text-[11px] text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1 py-1 px-1 -ml-1 active:scale-95 transition"
              >
                ← voltar
              </button>

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
                  <span className="text-gradient">
                    esse preco nao vai durar
                  </span>
                </h2>
                <p className="mt-1.5 text-[12px] font-semibold text-primary">
                  Você vai entrar no 🔥 Club Proibido - Hotflix
                </p>
              </div>

              {stage3 >= 1 && (
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

              {stage3 >= 2 && (
                <UrgencyNotice />
              )}
            </>
          )}

          {/* ETAPA 4 */}
          {step === 4 && (
            <>
              <OrderBumpScreen
                plan={selectedPlan}
                onBack={() => setStep(3)}
                onConfirm={(bump) => {
                  setWithBump(bump);
                  setStep(5);
                }}
              />
            </>
          )}

          {/* ETAPA 5 — PIX */}
          {step === 5 && (
            <>
              <button
                onClick={() => setStep(4)}
                className="text-[11px] text-muted-foreground hover:text-primary mb-2 inline-flex items-center gap-1 py-1 px-1 -ml-1 active:scale-95 transition"
              >
                ← voltar
              </button>
              <PixDirect
                plan={selectedPlan}
                withBump={withBump}
                onPaid={() => setStep(6)}
              />

              <div className="mt-3 rounded-2xl bg-destructive/10 border border-destructive/40 px-3 py-2 text-center">
                <p className="text-[12px] text-foreground font-medium leading-snug">
                  🚨 Promoção ativa{" "}
                  <strong className="text-primary">só agora</strong>. Se sair
                  da página pode perder.
                </p>
              </div>
            </>
          )}

          {/* ETAPA 6 — Sucesso */}
          {step === 6 && (
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
