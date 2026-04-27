import { useEffect, useState } from "react";

const ITEMS = [
  { name: "João V.", text: "Melhor compra que fiz 😍", stars: 5 },
  { name: "Lucas M.", text: "Valeu muito a pena, conteúdo top", stars: 5 },
  { name: "Pedro R.", text: "Entrei e curti demais 🔥", stars: 5 },
  { name: "Diego S.", text: "Surreal o que tem lá dentro 😈", stars: 5 },
  { name: "Rafa T.", text: "Acesso liberado na hora, recomendo", stars: 5 },
];

export function Testimonials() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % ITEMS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mt-8 pt-6 border-t border-border/60">
      <p className="text-center text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
        ⭐ Quem já entrou diz
      </p>

      <div className="relative h-[110px] overflow-hidden">
        {ITEMS.map((item, idx) => (
          <div
            key={idx}
            className="absolute inset-0 transition-all duration-500 ease-out"
            style={{
              opacity: idx === i ? 1 : 0,
              transform: `translateY(${idx === i ? 0 : 12}px)`,
              pointerEvents: idx === i ? "auto" : "none",
            }}
          >
            <div className="rounded-2xl bg-card border border-border p-4 h-full flex flex-col justify-center neon-glow">
              <div className="flex items-center gap-1 mb-1.5">
                {Array.from({ length: item.stars }).map((_, s) => (
                  <span key={s} className="text-primary text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[15px] text-foreground font-medium leading-snug">
                "{item.text}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                — {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {ITEMS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
            }`}
            aria-label={`depoimento ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
