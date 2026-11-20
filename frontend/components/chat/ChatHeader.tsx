// components/chat/ChatHeader.tsx
"use client";

import type { ReactNode } from "react";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  isConnected: boolean;
}

export function ChatHeader({ title, subtitle, icon, isConnected }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
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
          {isConnected ? "متصل" : "جارٍ الاتصال..."}
        </span>
      </div>
    </header>
  );
}