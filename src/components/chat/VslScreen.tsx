import { useCallback, useEffect, useRef, useState } from "react";
import { CtaButton } from "./CtaButton";

interface Props {
  onContinue: () => void;
  videoSrc?: string;
}

const REVEAL_AFTER_SECONDS = 5;

// Detecta iOS / iPadOS / Safari — eles têm regras de autoplay mais duras:
// autoplay COM som só funciona dentro de um gesto do usuário (touchend/click),
// e o gesto precisa disparar muted=false + play() de forma SÍNCRONA.
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se apresenta como Mac — detecta por touch
  const isiPadOS =
    /Macintosh/.test(ua) && typeof document !== "undefined" &&
    "ontouchend" in document;
  return isiOS || isiPadOS;
}

export function VslScreen({ onContinue, videoSrc = "/vsl.mp4" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [watched, setWatched] = useState(0);
  const [revealed, setRevealed] = useState(false);
  // Começa MUDO por padrão — garante que o vídeo toca em qualquer browser,
  // especialmente iOS/Safari. O áudio é destravado no primeiro gesto.
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const audioUnlockedRef = useRef(false);

  // 1) Garantir autoplay (mudo) em todos os browsers, incluindo iOS Safari.
  //    No iOS, atributos `muted` + `playsinline` são OBRIGATÓRIOS.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const isIOS = detectIOS();

    // iOS exige muted=true no DOM antes do primeiro play(). Só em browsers
    // não-iOS arriscamos autoplay com som (Chrome desktop com MEI etc).
    v.muted = true;
    v.volume = 1;
    // atributo HTML (não só prop) — alguns browsers olham o atributo
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("webkit-playsinline", "");

    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        /* aguardará o gesto */
      }
    };

    const onCanPlay = () => {
      setReady(true);
      if (v.paused) tryPlay();
    };
    v.addEventListener("loadeddata", onCanPlay);
    v.addEventListener("canplay", onCanPlay);
    tryPlay();

    // Em browsers desktop (NÃO iOS), tenta autoplay com som logo após
    // o primeiro frame — muitos browsers permitem se houve engagement prévio.
    if (!isIOS) {
      const onPlaying = () => {
        if (audioUnlockedRef.current) return;
        v.muted = false;
        const p = v.play();
        if (p && typeof p.then === "function") {
          p.then(() => {
            audioUnlockedRef.current = true;
            setMuted(false);
          }).catch(() => {
            // bloqueado — mantém mudo, usuário destrava no primeiro gesto
            v.muted = true;
            setMuted(true);
          });
        }
        v.removeEventListener("playing", onPlaying);
      };
      v.addEventListener("playing", onPlaying);
      return () => {
        v.removeEventListener("loadeddata", onCanPlay);
        v.removeEventListener("canplay", onCanPlay);
        v.removeEventListener("playing", onPlaying);
      };
    }

    return () => {
      v.removeEventListener("loadeddata", onCanPlay);
      v.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // 2) Destrava o áudio no PRIMEIRO gesto do usuário.
  //    Crítico no iOS: o handler roda síncrono dentro do gesto — sem `await`
  //    antes de `muted=false` e `play()`. O iOS só libera áudio se a troca
  //    acontecer dentro da mesma task do evento de toque.
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current) return;
    const v = videoRef.current;
    if (!v) return;
    // Síncrono: muted=false e play() no mesmo tick do gesto
    v.muted = false;
    v.removeAttribute("muted");
    v.volume = 1;
    const p = v.play();
    audioUnlockedRef.current = true;
    setMuted(false);
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // improvável após gesto, mas fallback mantém fluxo
        v.muted = true;
        setMuted(true);
        audioUnlockedRef.current = false;
        v.play().catch(() => {});
      });
    }
  }, []);

  // 3) Listener global: primeiro toque/clique em qualquer lugar já destrava o som.
  useEffect(() => {
    const handler = () => unlockAudio();
    // touchend é mais confiável no iOS que touchstart para gesture-gated APIs
    document.addEventListener("touchend", handler, { once: true, passive: true });
    document.addEventListener("click", handler, { once: true });
    return () => {
      document.removeEventListener("touchend", handler);
      document.removeEventListener("click", handler);
    };
  }, [unlockAudio]);

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

  // Toggle manual — também síncrono para respeitar a regra do iOS
  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.removeAttribute("muted");
      audioUnlockedRef.current = true;
      setMuted(false);
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      v.muted = true;
      setMuted(true);
    }
  }, []);

  const progressPct = Math.min(
    100,
    (watched / REVEAL_AFTER_SECONDS) * 100,
  );

  return (
    <div
      className="pt-0.5"
      style={{ animation: "message-in 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {/* Player 9:16 */}
      <div className="flex justify-center">
        <div className="w-full max-w-[240px] sm:max-w-[280px] mx-auto">
          <div className="relative w-full aspect-[9/16] rounded-[1.5rem] overflow-hidden border-2 border-primary/40 bg-black neon-glow">
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="metadata"
              poster="/vsl-poster.jpg"
              className="absolute inset-0 h-full w-full object-cover"
              controls={false}
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              {...({
                "webkit-playsinline": "true",
                "x5-playsinline": "true",
              } as Record<string, string>)}
            />

            {/* Spinner leve só enquanto o vídeo não tá pronto */}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none">
                <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            )}

            {/* Tag AO VIVO */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-black/60 backdrop-blur text-white px-2.5 py-1 rounded-full border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                mensagem pra você
              </span>
            </div>

            {/* Botão mute/unmute */}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Ativar som" : "Silenciar"}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 backdrop-blur border border-white/15 text-white flex items-center justify-center active:scale-95 transition"
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
      </div>

      {/* CTA ou hint */}
      <div className="mt-3 min-h-[64px]">
        {revealed ? (
          <div
            className="text-center"
            style={{ animation: "message-in 0.6s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <CtaButton onClick={onContinue}>
              QUERO VER O QUE TEM LÁ DENTRO 🔥
            </CtaButton>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Continua assistindo se quiser • só toca pra avançar
            </p>
          </div>
        ) : (
          <p className="text-center text-[11.5px] text-muted-foreground">
            assista para continuar...
          </p>
        )}
      </div>
    </div>
  );
}
