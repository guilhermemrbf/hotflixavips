import { useEffect, useRef, useState } from "react";
import { CtaButton } from "./CtaButton";
import { Bubble } from "./Bubble";

interface Props {
  onContinue: () => void;
  videoSrc?: string;
}

const REVEAL_AFTER_SECONDS = 5;

export function VslScreen({ onContinue, videoSrc = "/vsl.mp4" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [muted, setMuted] = useState(true);

  // Autoplay muted assim que a tela carrega
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  // Contador de tempo assistido — libera CTA após 5s
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setWatched(v.currentTime);
      if (v.currentTime >= REVEAL_AFTER_SECONDS) setRevealed(true);
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const progressPct = Math.min(
    100,
    (watched / REVEAL_AFTER_SECONDS) * 100,
  );

  return (
    <div
      className="pt-0 flex flex-col h-full"
      style={{ animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      <Bubble delay={0}>
        Antes de te mostrar... preciso te falar uma coisa
      </Bubble>

      {/* Player 9:16 */}
      <div className="mt-2 flex justify-center">
        <div
          className="relative rounded-[1.25rem] overflow-hidden border-2 border-primary/40 bg-black neon-glow mx-auto"
          style={{
            aspectRatio: "9 / 16",
            maxHeight: "min(62dvh, 560px)",
            width: "auto",
            height: "min(62dvh, 560px)",
          }}
        >
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              controls={false}
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
            />

            {/* Tag AO VIVO */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur text-white px-2 py-0.5 rounded-full border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                pra você
              </span>
            </div>

            {/* Botão mute/unmute */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Ativar som" : "Silenciar"}
              className="absolute top-2.5 right-2.5 z-10 h-8 w-8 rounded-full bg-black/60 backdrop-blur border border-white/15 text-white flex items-center justify-center active:scale-95 transition"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 9l-6 6M17 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {/* Hint pra ativar som */}
            {muted && (
              <button
                type="button"
                onClick={toggleMute}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[11px] font-semibold bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-full shadow-lg active:scale-95 whitespace-nowrap"
                style={{ animation: "message-in 0.4s ease both" }}
              >
                🔊 Toca pra ouvir
              </button>
            )}

            {/* Barra de progresso até liberar CTA */}
            {!revealed && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 z-10">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}
        </div>
      </div>

      {/* CTA ou hint */}
      <div className="mt-3 min-h-[60px]">
        {revealed ? (
          <div
            className="text-center"
            style={{ animation: "message-in 0.6s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <CtaButton onClick={onContinue}>
              QUERO VER O QUE TEM LÁ DENTRO 🔥
            </CtaButton>
          </div>
        ) : (
          <p className="text-center text-[11px] text-muted-foreground">
            assista para continuar...
          </p>
        )}
      </div>
    </div>
  );
}
