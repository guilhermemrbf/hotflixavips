import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Bubble, TypingBubble } from "./Bubble";
import { CtaButton } from "./CtaButton";
import { Plan, PlanCard } from "./PlanCard";

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

type Phase = "intro" | "vsl" | "plans" | "bump" | "pix" | "success";

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
  const [timeline, setTimeline] = useState<Phase[]>(["intro"]);
  const [introStage, setIntroStage] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [withBump, setWithBump] = useState(false);
  const [vipLink, setVipLink] = useState<string>(VIP_ACCESS_URL);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addPhase = (phase: Phase) => {
    setTimeline((prev) => (prev.includes(phase) ? prev : [...prev, phase]));
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setTimeline((prev) => {
      const hasBump = prev.includes("bump");
      const filtered = prev.filter(
        (p) => p !== "bump" && p !== "pix" && p !== "success",
      );
      return hasBump ? filtered : [...filtered, "bump"];
    });
  };

  const handleBumpBack = () => {
    setTimeline((prev) =>
      prev.filter((p) => p !== "bump" && p !== "pix" && p !== "success"),
    );
  };

  const handleBumpConfirm = (bump: boolean) => {
    setWithBump(bump);
    addPhase("pix");
  };

  const handlePaid = (inviteLink?: string | null) => {
    if (inviteLink) setVipLink(inviteLink);
    addPhase("success");
  };

  // Intro animation
  useEffect(() => {
    if (timeline.length > 1) return;
    const timers = [300, 1100, 2000].map((ms, i) =>
      setTimeout(() => setIntroStage(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [timeline]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 150);
    return () => clearTimeout(t);
  }, [timeline, introStage]);

  // VSL warm-up
  useEffect(() => {
    if (timeline.includes("vsl")) return;
    const img = new Image();
    img.src = "/vsl-poster.jpg";
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 800));
    idle(() => {
      import("./VslScreen").catch(() => {});
    });
  }, [timeline]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-2 sm:pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {/* Intro */}
          {timeline.includes("intro") && (
            <div>
              <p className="text-center text-[12px] text-muted-foreground mb-1.5">
                Hotflix 🔥 — Acesso exclusivo
              </p>

              {introStage < 1 ? (
                <TypingBubble />
              ) : (
                <Bubble delay={0}>Oii amor... tava te esperando 🔥</Bubble>
              )}
              {introStage >= 1 && introStage < 2 && <TypingBubble />}
              {introStage >= 2 && (
                <Bubble delay={0}>
                  Tenho um <strong>acesso privado</strong> esperando voce —
                  coisa que eu nao mando pra qualquer um
                </Bubble>
              )}
              {introStage >= 3 && (
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
                    <CtaButton
                      delay={0}
                      onClick={() => addPhase("vsl")}
                      disabled={timeline.includes("vsl")}
                    >
                      QUERO VER 🔥
                    </CtaButton>
                    <p className="mt-1.5 text-[12px] text-muted-foreground">
                      Grátis pra ver • Sem cadastro
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VSL */}
          {timeline.includes("vsl") && (
            <div className="mt-3">
              <Suspense fallback={<LazyFallback />}>
                <VslScreen onContinue={() => addPhase("plans")} />
              </Suspense>
            </div>
          )}

          {/* Plans */}
          {timeline.includes("plans") && (
            <div className="mt-3">
              <div
                className="text-center mb-3"
                style={{
                  animation:
                    "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <span className="inline-block text-[12px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full mb-2">
                  Acesso Liberado
                </span>
                <h2 className="text-[19px] sm:text-[23px] leading-tight font-extrabold text-foreground">
                  🔥 Escolhe seu acesso agora —{" "}
                  <span className="text-gradient">
                    esse preco nao vai durar
                  </span>
                </h2>
                <p className="mt-1.5 text-[12px] font-semibold text-primary">
                  Você vai entrar no 🔥 Club Proibido - Hotflix
                </p>
              </div>

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
                    onSelect={() => handlePlanSelect(p)}
                    delay={i * 100}
                  />
                ))}
              </div>

              <UrgencyNotice />
            </div>
          )}

          {/* Bump */}
          {timeline.includes("bump") && (
            <div className="mt-3">
              <Suspense fallback={<LazyFallback />}>
                <OrderBumpScreen
                  plan={selectedPlan}
                  onConfirm={handleBumpConfirm}
                  onBack={handleBumpBack}
                />
              </Suspense>
            </div>
          )}

          {/* Pix */}
          {timeline.includes("pix") && (
            <div className="mt-3">
              <Suspense fallback={<LazyFallback />}>
                <PixDirect
                  plan={selectedPlan}
                  withBump={withBump}
                  onPaid={handlePaid}
                />
              </Suspense>
            </div>
          )}

          {/* Success */}
          {timeline.includes("success") && (
            <div className="mt-3 pt-2">
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

function UrgencyNotice() {
  const [seconds, setSeconds] = useState(15 * 60);
  useEffect(() => {
    const t = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
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
        🚨 Preco promocional por tempo limitado. Pode subir a qualquer
        momento.
      </p>
      <p className="mt-1.5 font-mono text-base font-extrabold text-destructive tabular-nums">
        {mm}:{ss}
      </p>
    </div>
  );
}
