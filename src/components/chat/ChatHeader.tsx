import leticiaAvatar from "@/assets/leticia-avatar.webp";

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2.5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary-glow blur-md opacity-70" />
          <img
            src={leticiaAvatar}
            alt="Letícia • Hotflix"
            className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full ring-2 ring-primary/60 object-cover"
            loading="eager"
          />
          <span className="absolute bottom-0 right-0 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-online ring-2 ring-background animate-pulse-ring" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground tracking-tight flex items-center gap-1.5 text-[14px] sm:text-base leading-tight">
            <span className="text-primary">Hotflix</span>🔥
          </h1>
          <p className="text-[11px] text-online flex items-center gap-1.5 leading-tight">
            <span className="h-1.5 w-1.5 rounded-full bg-online" />
            online agora
          </p>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground transition"
          aria-label="opções"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
