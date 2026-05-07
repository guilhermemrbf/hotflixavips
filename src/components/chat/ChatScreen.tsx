import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { CtaButton } from "./CtaButton";
import { Plan, PlanCard } from "./PlanCard";
import leticiaPreview from "@/assets/leticia-preview.webp";

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

type Step = 1 | 2 | 3 | 4;

const PLAN_MAIN: Plan = {
  id: "vital",
  title: "Vitalicio + 500 Midias",
  description: "+500 fotos e videos exclusivos que ela nunca postou em nenhuma rede",
  price: "R$ 12,90",
  oldPrice: "R$ 49,90",
  badge: "🔥 MAIS ESCOLHIDO",
  highlight: true,
};

const OTHER_PLANS: Plan[] = [
  {
    id: "bonus",
    title: "💎 Vitalicio + Pack Secreto",
    description: "Acesso vitalicio + pack bonus de videos exclusivos",
    price: "R$ 8,90",
    oldPrice: "R$ 29,90",
  },
  {
    id: "videocall",
    title: "📹 Chamada de video",
    description: "30 minutos ao vivo, so voce e eu",
    price: "R$ 22,90",
    oldPrice: "R$ 79,90",
    badge: "EXCLUSIVO",
    highlight: true,
  },
  {
    id: "week",
    title: "🟢 1 Semana",
    price: "R$ 6,90",
    oldPrice: "R$ 19,90",
  },
];

const VIP_ACCESS_URL = "https://t.me/+0ApNmK8IQSFmNDRh";

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
}

function ProgressDots({ step }: { step: Step }) {
  if (step === 4) return null;
  const total = 3;
  const current = step;
  return (
    <div className="flex justify-center gap-1.5 py-2">
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const isCurrent = idx === current;
        const isPast = idx < current;
        return (
          <span
            key={i}
            className={
              "h-1.5 rounded-full transition-all duration-300 " +
              (isCurrent
                ? "w-6 bg-primary"
                : isPast
                  ? "w-1.5 bg-primary/60"
                  : "w-1.5 bg-muted-foreground/30")
            }
          />
        );
      })}
    </div>
  );
}

export function ChatScreen() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLAN_MAIN);
  const [stage1, setStage1] = useState(0);
  const [showOthers, setShowOthers] = useState(false);
  const [vipLink, setVipLink] = useState<string>(VIP_ACCESS_URL);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ETAPA 1 — sequencia: msg1 imediata, msg2 600ms, imagem 1200ms, msg3 1800ms, anchor 2200ms, CTA 2400ms
  useEffect(() => {
    if (step !== 1) return;
    setStage1(0);
    const schedule = [200, 800, 1400, 2000, 2400, 2700];
    const timers = schedule.map((ms, i) =>
      setTimeout(() => setStage1(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Scroll suave ao topo a cada transição de tela
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (step === 1) {
        // segue ancorado embaixo conforme bolhas crescem
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        el.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, [step, stage1]);

  const goPix = (plan: Plan) => {
    setSelectedPlan(plan);
    vibrate();
    setStep(3);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />
      <ProgressDots step={step} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div
          key={step}
          className="w-full max-w-sm sm:max-w-md mx-auto px-4 pt-2 pb-[max(2rem,env(safe-area-inset-bottom))]"
          style={{ animation: "message-in 0.3s ease both" }}
        >
          {/* ======== TELA 1 — abertura + previa unificadas ======== */}
          {step === 1 && (
            <>
              {stage1 < 1 ? (
                <TypingBubble />
              ) : (
                <Bubble delay={0}>Oii... vim te chamar aqui 🤭</Bubble>
              )}

              {stage1 >= 1 && stage1 < 2 && <TypingBubble />}
              {stage1 >= 2 && (
                <Bubble delay={0}>
                  Separei uma <strong>previa exclusiva</strong> so pra voce ver
                </Bubble>
              )}

              {stage1 >= 3 && (
                <div
                  className="flex justify-start mb-2"
                  style={{
                    animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <div className="max-w-[88%] p-1.5 bg-bubble-her rounded-[1.25rem] rounded-bl-[0.25rem] shadow-soft">
                    <div className="relative rounded-2xl overflow-hidden border border-primary/40 neon-glow">
                      <img
                        src={leticiaPreview}
                        alt="Previa exclusiva Hotflix"
                        className="w-full h-auto block max-h-[42dvh] object-cover"
                        loading="eager"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-2.5 py-1 rounded-full shadow-lg">
                          🔥 Previa
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stage1 >= 3 && stage1 < 4 && <TypingBubble />}
              {stage1 >= 4 && (
                <Bubble delay={0}>
                  Isso e so uma amostra. La dentro tem mais de{" "}
                  <strong>500 midias</strong> que eu nunca postei em lugar nenhum 🔒
                </Bubble>
              )}

              {stage1 >= 5 && (
                <p
                  className="text-center text-[14px] text-primary font-semibold mt-3 flex items-center justify-center gap-1.5"
                  style={{
                    animation: "message-in 0.4s ease both",
                  }}
                >
                  <span>🔒</span>
                  Por apenas <strong className="text-gradient">R$12,90</strong> voce ve tudo — so hoje
                </p>
              )}

              {stage1 >= 6 && (
                <div
                  className="mt-3"
                  style={{
                    animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                  }}
                >
                  <CtaButton
                    delay={0}
                    onClick={() => {
                      vibrate();
                      setStep(2);
                    }}
                  >
                    QUERO VER TUDO 🔥
                  </CtaButton>
                </div>
              )}
            </>
          )}

          {/* ======== TELA 2 — plano unico em destaque ======== */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="text-center">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-online/15 text-online px-3 py-1 rounded-full">
                  ✅ Acesso liberado
                </span>
                <h2 className="mt-2 text-[22px] leading-tight font-extrabold text-foreground">
                  Escolhe agora —{" "}
                  <span className="text-gradient">esse preco some em breve</span>
                </h2>
              </div>

              {/* Card plano principal */}
              <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-card to-card p-4 neon-glow">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-lg whitespace-nowrap">
                  {PLAN_MAIN.badge}
                </span>

                <h3 className="mt-1 text-[17px] font-extrabold text-foreground">
                  {PLAN_MAIN.title}
                </h3>
                <p className="mt-1 text-[12.5px] text-muted-foreground leading-snug">
                  {PLAN_MAIN.description}
                </p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[13px] text-muted-foreground line-through">
                    {PLAN_MAIN.oldPrice}
                  </span>
                  <span className="text-[32px] font-extrabold text-foreground leading-none">
                    {PLAN_MAIN.price}
                  </span>
                </div>

                <button
                  onClick={() => goPix(PLAN_MAIN)}
                  style={{ height: 52, borderRadius: 14 }}
                  className="mt-3 w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-extrabold text-[14.5px] tracking-wide neon-glow active:scale-[0.98] animate-pulse-glow transition"
                >
                  LIBERAR ACESSO POR R$12,90
                </button>
              </div>

              <UrgencyTimer />

              {/* Expansivel — outros planos */}
              <div>
                <button
                  onClick={() => setShowOthers((v) => !v)}
                  className="w-full text-center text-[12px] text-muted-foreground hover:text-primary py-2 underline underline-offset-4 transition"
                >
                  {showOthers ? "Esconder outros planos ↑" : "Ver outros planos ↓"}
                </button>

                {showOthers && (
                  <div
                    className="space-y-2 mt-1"
                    style={{ animation: "message-in 0.4s ease both" }}
                  >
                    {OTHER_PLANS.map((p, i) => (
                      <PlanCard
                        key={p.id}
                        plan={p}
                        selected={false}
                        onSelect={() => goPix(p)}
                        delay={i * 60}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* CTA redundante */}
              <button
                onClick={() => goPix(PLAN_MAIN)}
                style={{ height: 52, borderRadius: 14 }}
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-extrabold text-[14.5px] tracking-wide neon-glow active:scale-[0.98] transition mt-2"
              >
                QUERO MEU ACESSO AGORA 🔒
              </button>
              <p className="text-center text-[10.5px] text-muted-foreground">
                🔒 Pix seguro · 100% sigiloso
              </p>
            </div>
          )}

          {/* ======== TELA 3 — Pix ======== */}
          {step === 3 && (
            <Suspense fallback={<LazyFallback />}>
              <PixDirect
                plan={selectedPlan}
                withBump={false}
                onPaid={(inviteLink) => {
                  if (inviteLink) setVipLink(inviteLink);
                  setStep(4);
                }}
              />
            </Suspense>
          )}

          {/* ======== TELA 4 — Sucesso ======== */}
          {step === 4 && (
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

function UrgencyTimer() {
  const [seconds, setSeconds] = useState(10 * 60);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <div className="rounded-2xl bg-destructive/20 border border-destructive/50 px-4 py-3 text-center">
      <p className="text-[12.5px] text-white/90 font-semibold leading-snug">
        ⏱ Esse preco expira em:
      </p>
      <p
        className="mt-1 font-mono font-extrabold text-destructive tabular-nums"
        style={{ fontSize: "clamp(20px, 6vw, 24px)" }}
      >
        {mm}:{ss}
      </p>
    </div>
  );
}
