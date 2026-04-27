import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  delay?: number;
}

export const CtaButton = forwardRef<HTMLButtonElement, CtaButtonProps>(
  ({ className, variant = "primary", delay = 0, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        style={{
          animation: `message-in 0.45s cubic-bezier(0.22,1,0.36,1) both`,
          animationDelay: `${delay}ms`,
          ...props.style,
        }}
        className={cn(
          "w-full rounded-full px-6 py-3.5 font-bold text-[15px] tracking-wide transition-transform duration-200 active:scale-[0.97]",
          variant === "primary" &&
            "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground neon-glow hover:scale-[1.02] animate-pulse-glow",
          variant === "ghost" &&
            "bg-secondary text-foreground border border-border hover:border-primary/60 hover:text-primary",
          className
        )}
      >
        {children}
      </button>
    );
  }
);
CtaButton.displayName = "CtaButton";
