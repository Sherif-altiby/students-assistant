import { MessageCircle } from "lucide-react";

interface ChatHeaderProps {
  isConnected: boolean;
}

export function ChatHeader({ isConnected }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-foreground">Study Room</h1>
          <p className="text-xs text-muted-foreground">One room for everyone, in real time</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1">
        <span className="relative flex h-1.5 w-1.5">
          {isConnected && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-chart-2 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-chart-2" : "bg-muted-foreground"
            }`}
          />
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {isConnected ? "Live" : "Connecting"}
        </span>
      </div>
    </header>
  );
}