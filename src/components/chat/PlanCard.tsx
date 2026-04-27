import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface Plan {
  id: string;
  title: string;
  description?: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  highlight?: boolean;
}

interface Props {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
}

export function PlanCard({ plan, selected, onSelect, delay = 0 }: Props) {
  const isHighlight = plan.highlight;

  return (
    <button
      onClick={onSelect}
      style={{
        animation: `message-in 0.5s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${delay}ms`,
      }}
      className={cn(
        "w-full text-left rounded-2xl p-3 sm:p-4 border-2 transition-all duration-200 relative overflow-hidden active:scale-[0.98]",
        isHighlight
          ? "border-primary bg-gradient-to-br from-primary/15 via-card to-card neon-glow"
          : selected
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover:border-primary/50"
      )}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-px right-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-b-lg shadow-lg",
            "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
          )}
        >
          {plan.badge}
        </span>
      )}

      <div className="flex items-center gap-2.5 mt-0.5">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-[13.5px] sm:text-[15px] leading-tight pr-2">
            {plan.title}
          </p>
          {plan.description && (
            <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug pr-2">
              {plan.description}
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-1">
            {plan.oldPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                {plan.oldPrice}
              </span>
            )}
            <span
              className={cn(
                "font-extrabold text-lg sm:text-2xl",
                isHighlight ? "text-gradient" : "text-foreground"
              )}
            >
              {plan.price}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition",
            isHighlight
              ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg animate-pulse-glow"
              : "bg-secondary text-foreground border border-border"
          )}
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </div>
      </div>
    </button>
  );
}
