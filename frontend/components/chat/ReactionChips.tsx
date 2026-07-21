"use client";

import type { ReactionType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ReactionChipsProps {
  counts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  onReact: (type: ReactionType) => void;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string }[] = [
  { type: "LIKE", emoji: "👍" },
  { type: "LOVE", emoji: "❤️" },
  { type: "SUPPORT", emoji: "🙌" },
];

export function ReactionChips({ counts, myReaction, onReact }: ReactionChipsProps) {
  const active = REACTION_CONFIG.filter((r) => counts[r.type] > 0);
  if (active.length === 0) return null;

  return (
    <div className="mt-1 flex gap-1 pl-1">
      {active.map((r) => (
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
    </div>
  );
}