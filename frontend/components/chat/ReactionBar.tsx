"use client";

import type { ReactionType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ReactionBarProps {
  counts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
  showPicker: boolean;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "SUPPORT", emoji: "🙌", label: "Support" },
];

export function ReactionBar({ counts, myReaction, onReact, showPicker }: ReactionBarProps) {
  const activeChips = REACTION_CONFIG.filter((r) => counts[r.type] > 0);

  return (
    <div className="flex items-center gap-1.5">
      {activeChips.map((r) => (
        <button
          key={r.type}
          onClick={() => onReact(r.type)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            myReaction === r.type
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <span className="text-xs leading-none">{r.emoji}</span>
          <span className="tabular-nums">{counts[r.type]}</span>
        </button>
      ))}

      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-sm transition-all duration-150",
          showPicker
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-0.5 opacity-0",
        )}
      >
        {REACTION_CONFIG.map((r) => (
          <button
            key={r.type}
            onClick={() => onReact(r.type)}
            title={r.label}
            className={cn(
              "rounded-full p-1 text-sm leading-none transition-transform hover:scale-125",
              myReaction === r.type && "bg-accent",
            )}
          >
            {r.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}