import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
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

type ChatPhase = "intro" | "vsl" | "plans" | "bump" | "pix" | "success";

type TimelineItem =
  | { id: string; type: "bot"; content: React.ReactNode }
  | { id: string; type: "user"; content: React.ReactNode }
  | { id: string; type: "typing" }
  | { id: string; type: "vsl" }
  | { id: string; type: "plans" }
  | { id: string; type: "bump" }
  | { id: string; type: "pix" }
  | { id: string; type: "success" };

type TimelineItemDraft = TimelineItem extends infer Item
  ? Item extends { id: string }
    ? Omit<Item, "id">
    : never
  : never;

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
  const [phase, setPhase] = useState<ChatPhase>("intro");
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[0]);
  const [withBump, setWithBump] = useState(false);
  const [vipLink, setVipLink] = useState<string>(VIP_ACCESS_URL);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const nextIdRef = useRef(0);
  const startedRef = useRef(false);
  const vslCompletedRef = useRef(false);
  const paidRef = useRef(false);

  const pushItem = useCallback((item: TimelineItemDraft) => {
    const id = `chat-${nextIdRef.current++}`;
    setItems((current) => [...current, { ...item, id } as TimelineItem]);
    return id;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const timer = window.setTimeout(fn, delay);
    timersRef.current.push(timer);
  }, []);

  const botAfterTyping = useCallback(
    (content: React.ReactNode, delay: number, typingTime = 620) => {
      schedule(() => {
        const typingId = pushItem({ type: "typing" });
        schedule(() => {
          removeItem(typingId);
          pushItem({ type: "bot", content });
        }, typingTime);
      }, delay);
    },
    [pushItem, removeItem, schedule],
  );

  // Warm-up leve: apenas o poster e o chunk JS da VSL enquanto o usuário
  // lê o chat. O VÍDEO (6MB) só baixa quando a prévia automática entra —
  // isso reduz muito o uso de banda no carregamento inicial.
  useEffect(() => {
    const img = new Image();
    img.src = "/vsl-poster.jpg";
    // Pré-importa o chunk da VSL em idle (sem bloquear)
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 800));
    idle(() => {
      import("./VslScreen").catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    botAfterTyping(<>Oii amor... tava te esperando 🔥</>, 250, 520);
    botAfterTyping(
      <>
        Tenho um <strong>acesso privado</strong> esperando voce — coisa que eu
        nao mando pra qualquer um
      </>,
      1250,
      720,
    );
    schedule(() => {
      setPhase("vsl");
      pushItem({ type: "user", content: "Quero ver 🔥" });
    }, 2450);
    botAfterTyping(
      "Separei uma prévia rápida pra você. Depois eu já libero as opções.",
      2850,
      520,
    );
    schedule(() => pushItem({ type: "vsl" }), 3820);

    return () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
    };
  }, [botAfterTyping, pushItem, schedule]);

  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [items.length, phase, selectedPlan.id, withBump]);

  const handleVslComplete = useCallback(() => {
    if (vslCompletedRef.current) return;
    vslCompletedRef.current = true;
    setPhase("plans");
    setItems((current) =>
      current.map((item) =>
        item.type === "vsl"
          ? { id: item.id, type: "bot", content: "Prévia liberada ✅" }
          : item,
      ),
    );
    botAfterTyping("Pronto. Agora escolhe o acesso que faz mais sentido pra você:", 450, 580);
    schedule(() => pushItem({ type: "plans" }), 1350);
  }, [botAfterTyping, pushItem, schedule]);

  const handlePlanSelect = useCallback(
    (plan: Plan) => {
      if (phase !== "plans") return;
      setSelectedPlan(plan);
      setWithBump(false);
      setPhase("pix");
      setItems((current) => current.filter((item) => item.type !== "plans"));
      pushItem({ type: "user", content: <>Escolhi: {plan.title}</> });
      botAfterTyping("Fechado. Vou gerar seu Pix agora e liberar tudo automaticamente quando cair.", 360, 560);
      schedule(() => pushItem({ type: "pix" }), 1250);
    },
    [botAfterTyping, phase, pushItem, schedule],
  );

  const handleBumpConfirm = useCallback(
    (bump: boolean) => {
      if (phase !== "bump") return;
      setWithBump(bump);
      setPhase("pix");
      pushItem({
        type: "user",
        content: bump ? "Quero adicionar o Pack Secreto 🎁" : "Vou seguir sem o bônus",
      });
      botAfterTyping("Fechado. Vou gerar seu Pix agora e liberar tudo automaticamente quando cair.", 360, 560);
      schedule(() => pushItem({ type: "pix" }), 1250);
    },
    [botAfterTyping, phase, pushItem, schedule],
  );

  const handlePaid = useCallback(
    (inviteLink?: string | null) => {
      if (paidRef.current) return;
      paidRef.current = true;
      if (inviteLink) setVipLink(inviteLink);
      setPhase("success");
      pushItem({ type: "user", content: "Pagamento confirmado ✅" });
      pushItem({ type: "success" });
    },
    [pushItem],
  );

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <ChatHeader />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-2 sm:pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-[10.5px] text-muted-foreground mb-2">
            Letícia • Hotflix — Acesso exclusivo
          </p>
          {items.map((item) => (
            <TimelineRenderer
              key={item.id}
              item={item}
              phase={phase}
              selectedPlan={selectedPlan}
              withBump={withBump}
              vipLink={vipLink}
              onVslComplete={handleVslComplete}
              onPlanSelect={handlePlanSelect}
              onBumpConfirm={handleBumpConfirm}
              onPaid={handlePaid}
            />
          ))}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>
    </div>
  );
}

interface TimelineRendererProps {
  item: TimelineItem;
  phase: ChatPhase;
  selectedPlan: Plan;
  withBump: boolean;
  vipLink: string;
  onVslComplete: () => void;
  onPlanSelect: (plan: Plan) => void;
  onBumpConfirm: (withBump: boolean) => void;
  onPaid: (inviteLink?: string | null) => void;
}

function TimelineRenderer({
  item,
  phase,
  selectedPlan,
  withBump,
  vipLink,
  onVslComplete,
  onPlanSelect,
  onBumpConfirm,
  onPaid,
}: TimelineRendererProps) {
  if (item.type === "bot") return <Bubble delay={0}>{item.content}</Bubble>;
  if (item.type === "user") return <Bubble from="me" delay={0}>{item.content}</Bubble>;
  if (item.type === "typing") return <TypingBubble />;

  if (item.type === "vsl") {
    return (
      <Suspense fallback={<LazyFallback />}>
        <VslScreen autoContinue onContinue={onVslComplete} />
      </Suspense>
    );
  }

  if (item.type === "plans") {
    return (
      <div
        className="mt-3 space-y-2"
        style={{ animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="text-center mb-2">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2.5 py-0.5 rounded-full mb-2">
            Acesso Liberado
          </span>
          <h2 className="text-[17px] sm:text-[22px] leading-tight font-extrabold text-foreground">
            🔥 Escolhe seu acesso agora — <span className="text-gradient">esse preco nao vai durar</span>
          </h2>
          <p className="mt-1.5 text-[12px] font-semibold text-primary">
            Você vai entrar no 🔥 Club Proibido - Hotflix
          </p>
        </div>
        {PLANS.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan.id === plan.id}
            onSelect={() => onPlanSelect(plan)}
            delay={index * 75}
          />
        ))}
        {phase === "plans" && <UrgencyNotice />}
      </div>
    );
  }

  if (item.type === "bump") {
    return (
      <Suspense fallback={<LazyFallback />}>
        <OrderBumpScreen
          plan={selectedPlan}
          showBack={false}
          onConfirm={onBumpConfirm}
        />
      </Suspense>
    );
  }

  if (item.type === "pix") {
    return (
      <Suspense fallback={<LazyFallback />}>
        <PixDirect plan={selectedPlan} withBump={withBump} onPaid={onPaid} />
      </Suspense>
    );
  }

  return (
    <div className="pt-2">
      <Suspense fallback={<LazyFallback />}>
        <PaymentSuccess telegramUrl={vipLink} planTitle={selectedPlan.title} />
        <Testimonials />
      </Suspense>
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
