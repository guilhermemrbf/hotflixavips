import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  telegramUrl: string;
  planTitle?: string;
}

export function PaymentSuccess({ telegramUrl, planTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(15 * 60); // 15 min
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [bumpPix, setBumpPix] = useState<string | null>(null);
  const [bumpCopied, setBumpCopied] = useState(false);
  const [bumpError, setBumpError] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  const handleOpen = () => {
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(telegramUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const handleUpsellBuy = async () => {
    setUpsellLoading(true);
    setBumpError(null);
    try {
      const res = await fetch("/api/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: "bump", utms: {} }),
      });
      const data = await res.json();
      if (data?.pix_copy_paste) {
        setBumpPix(data.pix_copy_paste as string);
      } else {
        setBumpError("Nao foi possivel gerar o bonus agora. Tenta novamente.");
      }
    } catch {
      setBumpError("Erro ao gerar o bonus. Tenta novamente.");
    } finally {
      setUpsellLoading(false);
    }
  };

  const handleBumpCopy = async () => {
    if (!bumpPix) return;
    try {
      await navigator.clipboard.writeText(bumpPix);
      setBumpCopied(true);
      setTimeout(() => setBumpCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const handleDismissUpsell = () => {
    setUpsellDismissed(true);
    handleOpen();
  };

  return (
    <div
      className="relative w-full"
      style={{ animation: "message-in 0.6s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {/* Glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, oklch(0.7 0.22 250 / 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Confetti dots */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 overflow-hidden -z-10">
        {[
          { l: "10%", d: "0s", c: "var(--primary)" },
          { l: "25%", d: "0.3s", c: "var(--primary-glow)" },
          { l: "45%", d: "0.6s", c: "var(--online)" },
          { l: "65%", d: "0.2s", c: "var(--primary)" },
          { l: "80%", d: "0.5s", c: "var(--primary-glow)" },
          { l: "92%", d: "0.8s", c: "var(--online)" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute top-0 h-2 w-2 rounded-full"
            style={{
              left: p.l,
              background: p.c,
              animation: `float 2.4s ease-in-out ${p.d} infinite`,
              boxShadow: `0 0 12px ${p.c}`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="rounded-3xl border border-primary/40 bg-gradient-to-b from-card via-card to-background/60 p-6 sm:p-8 shadow-soft neon-glow">
        {/* Success seal */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-online/30 blur-2xl animate-pulse-glow" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-online to-primary-glow flex items-center justify-center neon-glow">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 30,
                    strokeDashoffset: 30,
                    animation: "draw-check 0.7s ease-out 0.2s forwards",
                  }}
                />
              </svg>
            </div>
          </div>

          <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] bg-online/15 text-online px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-online animate-pulse" />
            Pagamento aprovado
          </span>

          <h1 className="mt-4 text-[26px] sm:text-[30px] leading-tight font-extrabold text-foreground">
            🎉 <span className="text-gradient">Voce esta dentro!</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Seu acesso foi liberado.{" "}
            <strong className="text-foreground">
              Clica no botao abaixo pra entrar.
            </strong>
          </p>

          {planTitle && (
            <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full">
              <span>Plano:</span>
              <span className="text-foreground">{planTitle}</span>
            </div>
          )}
        </div>

        {/* Telegram CTA */}
        <button
          onClick={handleOpen}
          className="group relative mt-7 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#229ED9] via-[#2AABEE] to-[#229ED9] px-5 py-4 text-white font-extrabold text-base shadow-soft transition active:scale-[0.98]"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08) inset, 0 12px 30px -8px rgba(34,158,217,0.55)",
          }}
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
            <span className="tracking-wide">ACESSAR AGORA</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        {/* Upsell — Pack Secreto */}
        {!upsellDismissed && (
          <div className="mt-5 rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/15 via-card to-card p-4 neon-glow">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-primary">
              🎁 Espera — antes de entrar
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-foreground leading-snug">
              Voce ganhou um bonus.
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground leading-snug">
              So pra quem comprou agora: o{" "}
              <strong className="text-foreground">Pack Secreto completo</strong>{" "}
              por mais{" "}
              <strong className="text-primary">R$ 3,90</strong>. Nao vai
              aparecer de novo depois que voce sair.
            </p>

            {!bumpPix ? (
              <>
                <button
                  onClick={handleUpsellBuy}
                  disabled={upsellLoading}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-3 text-sm font-extrabold uppercase tracking-wide shadow-soft neon-glow active:scale-[0.98] transition disabled:opacity-60"
                >
                  {upsellLoading
                    ? "Gerando Pix do bonus…"
                    : "QUERO O BONUS — R$ 3,90 SO AGORA"}
                </button>
                {bumpError && (
                  <p className="mt-2 text-[11px] text-destructive text-center">
                    {bumpError}
                  </p>
                )}
                <button
                  onClick={handleDismissUpsell}
                  className="mt-2 w-full text-center text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Nao, vou entrar sem o bonus
                </button>
              </>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-3">
                <p className="text-[12px] text-foreground text-center font-semibold">
                  Pague R$ 3,90 via Pix pra liberar o Pack Secreto:
                </p>
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={bumpPix} size={160} />
                </div>
                <button
                  onClick={handleBumpCopy}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-4 py-3 text-sm font-extrabold uppercase tracking-wide shadow-soft active:scale-[0.98] transition"
                >
                  {bumpCopied ? "✅ Codigo copiado" : "Copiar codigo Pix"}
                </button>
                <button
                  onClick={handleDismissUpsell}
                  className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Ja paguei — entrar no canal
                </button>
              </div>
            )}
          </div>
        )}

        {/* Copy link fallback */}
        <button
          onClick={handleCopy}
          className="mt-3 w-full rounded-xl border border-border bg-secondary/40 hover:bg-secondary/70 px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-online" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-online">Link copiado</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              copiar link de acesso
            </>
          )}
        </button>

        {/* Steps */}
        <div className="mt-6 rounded-2xl bg-secondary/40 border border-border/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
            Como entrar
          </p>
          <ol className="space-y-2.5">
            {[
              "Toca no botão acima",
              "Abre o Telegram e clica em ENTRAR no canal",
              "Pronto — todo conteúdo VIP liberado 🔥",
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                <span className="flex-shrink-0 mt-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Urgency */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span className="text-[12px] text-foreground font-medium">
              Acesso expira em
            </span>
          </div>
          <span className="font-mono text-base font-bold text-destructive tabular-nums">
            {mm}:{ss}
          </span>
        </div>

        {/* Trust */}
        <p className="mt-5 text-center text-[11px] text-muted-foreground leading-relaxed">
          🔒 Acesso pessoal e intransferível • Suporte 24h no privado
        </p>
      </div>

      <style>{`
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
