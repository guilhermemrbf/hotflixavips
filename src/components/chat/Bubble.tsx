import { cn } from "@/lib/utils";

interface BubbleProps {
  from?: "her" | "me";
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Bubble({
  from = "her",
  children,
  delay = 0,
  className,
}: BubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-1.5",
        from === "me" ? "justify-end" : "justify-start",
        className
      )}
      style={{
        animation: `message-in 0.45s cubic-bezier(0.22,1,0.36,1) both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[78%] text-[13.5px] sm:text-[14.5px] leading-snug shadow-soft",
          from === "her" ? "bubble-her" : "bubble-me font-medium"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function TypingBubble({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex justify-start mb-1.5"
      style={{
        animation: `message-in 0.3s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="bubble-her flex items-center gap-1 !py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-muted-foreground/70 inline-block"
            style={{
              animation: `typing 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
