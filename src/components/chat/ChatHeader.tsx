import leticiaAvatar from "@/assets/leticia-avatar.jpg";

export function ChatHeader() {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/50 pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md sm:max-w-lg mx-auto flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary-glow blur-md opacity-70" />
          <img
            src={leticiaAvatar}
            alt="Letícia VIP"
            className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full ring-2 ring-primary/60 object-cover"
            loading="eager"
          />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-online ring-2 ring-background animate-pulse-ring" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground tracking-tight flex items-center gap-1.5 text-[15px] sm:text-base">
            Letícia <span className="text-primary">VIP</span>
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3L4.3 7.6l5.3-.8L12 2z" />
            </svg>
          </h1>
          <p className="text-xs text-online flex items-center gap-1.5">
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
