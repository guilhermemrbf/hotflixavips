import { useState } from "react";
import { CtaButton } from "./CtaButton";

interface Props {
  onAccept: () => void;
  onSkip: () => void;
}

export function Upsell({ onAccept, onSkip }: Props) {
  const [taken, setTaken] = useState(false);

  if (taken) {
    return (
      <div className="mt-8 rounded-3xl border border-primary/50 bg-gradient-to-br from-primary/15 to-transparent p-5 text-center neon-glow"
        style={{ animation: "message-in 0.5s ease both" }}>
        <p className="text-2xl">✅</p>
        <p className="font-bold text-foreground mt-1">
          Upgrade liberado, amor 😘
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Te chamo no privado em instantes
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-8 rounded-3xl border border-primary/50 bg-gradient-to-br from-primary/15 via-card to-card p-5 text-left neon-glow"
      style={{ animation: "message-in 0.6s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full mb-3">
        🔥 Oferta secreta só pra membros
      </span>

      <h3 className="text-xl font-extrabold text-foreground leading-tight">
        🎥 Chamadas de Vídeo <span className="text-gradient">+ Vitalício</span>
      </h3>
      <p className="text-sm text-muted-foreground mt-2 leading-snug">
        Liberação imediata pra fazer chamada comigo no privado quando quiser 😈
      </p>

      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-xs text-muted-foreground line-through">
          R$ 89,90
        </span>
        <span className="text-3xl font-extrabold text-gradient">R$ 8,90</span>
      </div>

      <div className="mt-5 space-y-2.5">
        <CtaButton
          onClick={() => {
            setTaken(true);
            setTimeout(onAccept, 1400);
          }}
        >
          QUERO LIBERAR 🔥
        </CtaButton>
        <button
          onClick={onSkip}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition"
        >
          não, obrigado — pular
        </button>
      </div>
    </div>
  );
}
