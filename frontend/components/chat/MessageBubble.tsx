"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Reply } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "./Avatar";
import { ReactionChips } from "./ReactionChips";
import type { ChatMessage, ReactionType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId?: string;
  onReact: (messageId: string, type: ReactionType) => void;
  onReply: (message: ChatMessage) => void;
}

const REACTION_OPTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "SUPPORT", emoji: "🙌", label: "Support" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  onReact,
  onReply,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const reactionCounts = useMemo(() => {
    const counts: Record<ReactionType, number> = { LIKE: 0, LOVE: 0, SUPPORT: 0 };
    for (const r of message.reactions) counts[r.type]++;
    return counts;
  }, [message.reactions]);

  const myReaction = useMemo(
    () => message.reactions.find((r) => r.userId === currentUserId)?.type ?? null,
    [message.reactions, currentUserId],
  );

  const showAffordance = hovered || menuOpen;

  return (
    <div
      className={cn("flex items-start gap-2.5 py-1.5", isOwn && "flex-row-reverse")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      dir="ltr"
    >
      <Avatar userId={message.userId} name={message.user.name} />

      <div className={cn("flex min-w-0 max-w-md flex-1 flex-col", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-xs transition-shadow",
            showAffordance && "shadow-sm",
          )}
        >
          {/* Header: name + hover menu trigger */}
          <div className={cn("flex items-center gap-2", isOwn ? "flex-row-reverse justify-between" : "justify-between")}>
            <span className="text-sm font-semibold text-foreground">
              {isOwn ? "You" : message.user.name}
            </span>

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger  >
                <button
                  className={cn(
                    "shrink-0 rounded-full p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                    showAffordance ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                  aria-label="Message actions"
                >
                  <ChevronDown size={15} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-44">
                <DropdownMenuItem onClick={() => onReply(message)} className="gap-2">
                  <Reply size={14} />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-around px-2 py-1.5">
                  {REACTION_OPTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => {
                        onReact(message.id, r.type);
                        setMenuOpen(false);
                      }}
                      title={r.label}
                      className={cn(
                        "rounded-full p-1.5 text-base leading-none transition-transform hover:scale-125",
                        myReaction === r.type && "bg-accent",
                      )}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reply preview, if this message is a reply */}
          {message.replyTo && (
            <div className="my-1.5 rounded-lg border-l-2 border-primary/50 bg-muted px-2 py-1 text-xs">
              <p className="font-medium text-foreground/80">{message.replyTo.user.name}</p>
              <p className="truncate text-muted-foreground">{message.replyTo.content}</p>
            </div>
          )}

          {/* Message text */}
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-card-foreground">
            {message.content}
          </p>

          {/* Time, bottom-right */}
          <div className="mt-1 flex justify-end">
            <span className="text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</span>
          </div>
        </div>

        {/* Reaction chips, shown under the card once any exist */}
        <ReactionChips counts={reactionCounts} myReaction={myReaction} onReact={(type) => onReact(message.id, type)} />
      </div>
    </div>
  );
}