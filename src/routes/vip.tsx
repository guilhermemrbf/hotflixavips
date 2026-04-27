import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "Leticia VIP · Acesso ao grupo exclusivo no Telegram" },
      {
        name: "description",
        content:
          "Conteúdo +18 exclusivo da Leticia direto no Telegram. Acesso imediato por apenas R$ 19,90 via PIX.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VipPage,
});

const TELEGRAM_URL = "https://t.me/+0ApNmK8IQSFmNDRh";
const VALOR = 19.9;
const VALOR_RISCADO = 49.9;

type Etapa = "form" | "pix" | "pago";

type Utms = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

function captureUtms(): Utms {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
  const out: Utms = {};
  keys.forEach((k) => {
    const v = p.get(k);
    if (v) {
      out[k] = v;
      try {
        localStorage.setItem(k, v);
      } catch {}
    } else {
      try {
        const stored = localStorage.getItem(k);
        if (stored) out[k] = stored;
      } catch {}
    }
  });
  return out;
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function formatCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").trim();
  return d.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").trim();
}

function VipPage() {
  const [etapa, setEtapa] = useState<Etapa>("form");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [maior, setMaior] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [utms, setUtms] = useState<Utms>({});
  const [pixCode, setPixCode] = useState<string>("");
  const [transacaoId, setTransacaoId] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const [segundos, setSegundos] = useState(900);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    setUtms(captureUtms());
  }, []);

  // Timer PIX
  useEffect(() => {
    if (etapa !== "pix") return;
    setSegundos(900);
    const id = window.setInterval(() => {
      setSegundos((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [etapa]);

  // Polling status
  useEffect(() => {
    if (etapa !== "pix" || !transacaoId) return;
    const check = async () => {
      const { data } = await supabase
        .from("pagamentos")
        .select("status")
        .eq("transacao_id", transacaoId)
        .maybeSingle();
      if (data?.status === "pago") {
        setEtapa("pago");
      }
    };
    check();
    pollRef.current = window.setInterval(check, 5000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [etapa, transacaoId]);

  // Confete ao chegar em "pago"
  useEffect(() => {
    if (etapa !== "pago") return;
    const fire = () => {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#FF2D78", "#9B30FF", "#FFD700", "#C9A0DC"],
      });
    };
    fire();
    const t = setTimeout(fire, 700);
    return () => clearTimeout(t);
  }, [etapa]);

  const timerLabel = useMemo(() => {
    const m = Math.floor(segundos / 60).toString().padStart(2, "0");
    const s = (segundos % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [segundos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !email.trim() || !cpf.trim() || !telefone.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }
    if (onlyDigits(cpf).length !== 11) {
      setErro("CPF inválido.");
      return;
    }
    if (onlyDigits(telefone).length < 10) {
      setErro("Telefone inválido.");
      return;
    }
    if (!maior) {
      setErro("Você precisa confirmar que é maior de 18 anos.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("criar-pix", {
        body: {
          valor: VALOR,
          nome,
          email,
          cpf: onlyDigits(cpf),
          telefone: onlyDigits(telefone),
          utms,
        },
      });
      if (error) throw error;
      if (!data?.transacao_id || !data?.qr_code) {
        throw new Error(data?.error || "Falha ao gerar PIX");
      }
      setTransacaoId(data.transacao_id);
      setPixCode(data.qr_code);
      setEtapa("pix");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar pagamento.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white font-[Inter,system-ui,sans-serif]"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(255,45,120,0.18), transparent 50%), radial-gradient(circle at 80% 90%, rgba(155,48,255,0.22), transparent 55%), linear-gradient(160deg, #0D0D0D 0%, #1a0a2e 100%)",
      }}
    >
      {/* brilhos */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #FF2D78, transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #9B30FF, transparent 70%)" }} />

      <main className="relative mx-auto max-w-2xl px-4 py-10 md:py-16">
        {etapa === "form" && (
          <>
            {/* HERO */}
            <section className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs md:text-sm font-semibold tracking-wide backdrop-blur-md shadow-[0_0_30px_rgba(255,45,120,0.25)]">
                🔥 OFERTA EXCLUSIVA · VAGAS LIMITADAS
              </div>
              <h1 className="mt-6 text-4xl md:text-5xl font-extrabold leading-tight">
                Acesso ao Grupo VIP da{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#FF2D78,#9B30FF)" }}
                >
                  Leticia
                </span>{" "}
                🔒
              </h1>
              <p className="mt-4 text-base md:text-lg text-[#C9A0DC]">
                Conteúdo exclusivo e picante direto no seu Telegram. Acesse agora por apenas
                <span className="text-white font-semibold"> R$ 19,90</span> 💋
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FF2D78]/10 border border-[#FF2D78]/40 px-3 py-1 text-sm text-[#FFD700] font-semibold">
                ⚡ Apenas 7 vagas disponíveis
              </div>
            </section>

            {/* BENEFÍCIOS */}
            <section className="mt-10">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 md:p-6 shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {[
                    { icon: "📸", t: "Fotos e vídeos exclusivos diariamente" },
                    { icon: "⚡", t: "Acesso imediato após pagamento" },
                    { icon: "🔒", t: "Conteúdo 100% exclusivo e privado" },
                    { icon: "💬", t: "Suporte direto via Telegram" },
                  ].map((b) => (
                    <div
                      key={b.t}
                      className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3 hover:border-[#FF2D78]/50 transition"
                    >
                      <span className="text-2xl">{b.icon}</span>
                      <span className="text-sm md:text-base">{b.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CHECKOUT */}
            <section className="mt-8">
              <div className="relative rounded-2xl p-[1.5px]"
                style={{ background: "linear-gradient(135deg,#FF2D78,#9B30FF)" }}
              >
                <div className="rounded-2xl bg-[#120a1f]/90 backdrop-blur-xl p-6 md:p-8">
                  <div className="flex justify-center">
                    <span className="rounded-full px-3 py-1 text-xs font-bold tracking-wider text-black"
                      style={{ background: "linear-gradient(90deg,#FFD700,#FFB800)" }}
                    >
                      ACESSO COMPLETO
                    </span>
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-[#C9A0DC] line-through">R$ {VALOR_RISCADO.toFixed(2).replace(".", ",")}</div>
                    <div className="mt-1 text-5xl font-extrabold" style={{ color: "#FF2D78" }}>
                      R$ {VALOR.toFixed(2).replace(".", ",")}
                    </div>
                    <div className="mt-2 text-sm text-[#C9A0DC]">💳 Pagamento via PIX · Acesso imediato</div>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                    <Field label="Nome completo *">
                      <input
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Seu nome"
                        required
                        className={inputCls}
                      />
                    </Field>
                    <Field label="E-mail *">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        required
                        className={inputCls}
                      />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="CPF *">
                        <input
                          value={cpf}
                          onChange={(e) => setCpf(formatCpf(e.target.value))}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          required
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Telefone">
                        <input
                          value={telefone}
                          onChange={(e) => setTelefone(formatPhone(e.target.value))}
                          placeholder="(51) 99999-9999"
                          inputMode="numeric"
                          required
                          className={inputCls}
                        />
                      </Field>
                    </div>

                    <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={maior}
                        onChange={(e) => setMaior(e.target.checked)}
                        className="mt-1 h-5 w-5 accent-[#FF2D78]"
                      />
                      <span className="text-sm text-[#C9A0DC]">
                        Confirmo que sou maior de 18 anos e concordo com o conteúdo adulto +18.
                      </span>
                    </label>

                    {erro && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {erro}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 w-full rounded-xl px-6 py-4 font-extrabold tracking-wide text-white shadow-[0_10px_40px_rgba(255,45,120,0.45)] transition transform hover:-translate-y-0.5 disabled:opacity-60 animate-[pulseGlow_2s_ease-in-out_infinite]"
                      style={{ background: "linear-gradient(90deg,#FF2D78,#9B30FF)" }}
                    >
                      {loading ? "Gerando PIX..." : "💋 QUERO ACESSO VIP AGORA"}
                    </button>
                    <p className="text-center text-xs text-[#C9A0DC] pt-1">
                      🔒 Pagamento 100% seguro via SyncPay
                    </p>
                  </form>
                </div>
              </div>
            </section>
          </>
        )}

        {etapa === "pix" && (
          <section className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">Quase lá! Finalize seu pagamento 💸</h2>
            <p className="mt-2 text-[#C9A0DC]">Escaneie o QR Code ou use o PIX copia e cola.</p>

            <div className="mx-auto mt-6 inline-block rounded-2xl p-[2px]"
              style={{ background: "linear-gradient(135deg,#FF2D78,#9B30FF)" }}>
              <div className="rounded-2xl bg-white p-4">
                <QRCodeSVG value={pixCode} size={240} level="M" includeMargin={false} />
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-lg rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-left">
              <div className="text-xs uppercase tracking-wider text-[#C9A0DC]">PIX copia e cola</div>
              <div className="mt-2 break-all rounded-lg bg-black/40 p-3 text-xs text-white/90">
                {pixCode}
              </div>
              <button
                onClick={copiarPix}
                className="mt-3 w-full rounded-lg px-4 py-3 font-semibold text-white"
                style={{ background: "linear-gradient(90deg,#FF2D78,#9B30FF)" }}
              >
                {copiado ? "✅ Copiado!" : "📋 Copiar código PIX"}
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="text-[#FFD700] font-bold">⏳ Expira em {timerLabel}</div>
              <div className="animate-pulse text-[#C9A0DC]">⏳ Aguardando confirmação...</div>
            </div>
          </section>
        )}

        {etapa === "pago" && (
          <section className="text-center pt-8">
            <div className="text-7xl">🎉</div>
            <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">
              Pagamento confirmado! Bem-vinda ao VIP 🔥
            </h2>
            <p className="mt-3 text-[#C9A0DC]">✅ Acesso imediato garantido</p>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-xl px-8 py-4 font-extrabold tracking-wide text-white shadow-[0_10px_40px_rgba(155,48,255,0.55)] animate-[pulseGlow_2s_ease-in-out_infinite]"
              style={{ background: "linear-gradient(90deg,#FF2D78,#9B30FF)" }}
            >
              📲 ACESSAR GRUPO VIP AGORA
            </a>
          </section>
        )}

        <footer className="mt-16 text-center text-xs text-[#C9A0DC]/70">
          © Leticia VIP · Conteúdo destinado a maiores de 18 anos.
        </footer>
      </main>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,45,120,0.55), 0 10px 40px rgba(155,48,255,0.35); }
          50% { box-shadow: 0 0 0 12px rgba(255,45,120,0), 0 14px 50px rgba(155,48,255,0.55); }
        }
      `}</style>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-black/40 border border-white/10 px-3 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-[#FF2D78] focus:shadow-[0_0_0_3px_rgba(255,45,120,0.2)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#C9A0DC]">
        {label}
      </span>
      {children}
    </label>
  );
}