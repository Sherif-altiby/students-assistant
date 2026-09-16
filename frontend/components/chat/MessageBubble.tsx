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

const REACTION_OPTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
}[] = [
  { type: "LIKE", emoji: "👍", label: "Like" },
  { type: "LOVE", emoji: "❤️", label: "Love" },
  { type: "SUPPORT", emoji: "🙌", label: "Support" },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    const counts: Record<ReactionType, number> = {
      LIKE: 0,
      LOVE: 0,
      SUPPORT: 0,
    };

    for (const reaction of message.reactions) {
      counts[reaction.type]++;
    }

    return counts;
  }, [message.reactions]);

  const myReaction = useMemo(
    () =>
      message.reactions.find((reaction) => reaction.userId === currentUserId)
        ?.type ?? null,
    [message.reactions, currentUserId],
  );

  const showActions = hovered || menuOpen;

  return (
    <div
      dir="ltr"
      className={cn(
        "group flex w-full items-end gap-2 px-2 py-1",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="mb-0.5 shrink-0">
          <Avatar userId={message.userId} name={message.user.name} />
        </div>
      )}

      <div
        className={cn(
          "relative flex min-w-0 max-w-[min(75%,520px)] flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name */}
        {!isOwn && (
          <span className="mb-1 px-1 text-xs font-semibold text-muted-foreground">
            {message.user.name}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Actions - left side for own messages */}
          {isOwn && (
            <div
              className={cn(
                "order-first transition-all duration-150",
                showActions
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-1 opacity-0",
              )}
            >
              <MessageActions
                message={message}
                isOwn={isOwn}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                myReaction={myReaction}
                onReact={onReact}
                onReply={onReply}
              />
            </div>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              "relative min-w-0 px-3.5 py-2.5 text-sm shadow-sm",
              "transition-shadow duration-150",
              isOwn
                ? [
                    "rounded-2xl rounded-br-md",
                    "bg-primary text-primary-foreground",
                  ]
                : [
                    "rounded-2xl rounded-bl-md",
                    "border border-border/60",
                    "bg-card text-card-foreground",
                  ],
              showActions && "shadow-md",
            )}
          >
            {/* Reply preview */}
            {message.replyTo && (
              <div
                className={cn(
                  "mb-2 overflow-hidden rounded-lg border-l-2 px-2.5 py-1.5",
                  isOwn
                    ? "border-primary-foreground/50 bg-primary-foreground/10"
                    : "border-primary/50 bg-muted/80",
                )}
              >
                <p
                  className={cn(
                    "mb-0.5 text-[11px] font-semibold",
                    isOwn ? "text-primary-foreground/90" : "text-foreground",
                  )}
                >
                  {message.replyTo.user.name}
                </p>

                <p
                  className={cn(
                    "line-clamp-2 text-xs",
                    isOwn
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {/* Message content */}
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>

            {/* Time */}
            <div
              className={cn(
                "mt-1 flex items-center justify-end gap-1",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground",
              )}
            >
              <span className="text-[10px] leading-none">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions - right side for other users */}
          {!isOwn && (
            <div
              className={cn(
                "transition-all duration-150",
                showActions
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none -translate-x-1 opacity-0",
              )}
            >
              <MessageActions
                message={message}
                isOwn={isOwn}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                myReaction={myReaction}
                onReact={onReact}
                onReply={onReply}
              />
            </div>
          )}
        </div>

        {/* Reactions */}
        <div className={cn("relative z-10", isOwn ? "mr-1" : "ml-1")}>
          <ReactionChips
            counts={reactionCounts}
            myReaction={myReaction}
            onReact={(type) => onReact(message.id, type)}
          />
        </div>
      </div>
    </div>
  );
}

interface MessageActionsProps {
  message: ChatMessage;
  isOwn: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  myReaction: ReactionType | null;
  onReact: (messageId: string, type: ReactionType) => void;
  onReply: (message: ChatMessage) => void;
}

function MessageActions({
  message,
  isOwn,
  menuOpen,
  setMenuOpen,
  myReaction,
  onReact,
  onReply,
}: MessageActionsProps) {
  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger>
        <span
          role="button"
          tabIndex={0}
          aria-label="Message actions"
          className={cn(
            "flex h-7 w-7 items-center justify-center",
            "rounded-full border border-border/60 bg-background/90",
            "text-muted-foreground shadow-sm backdrop-blur",
            "transition-all duration-150",
            "hover:bg-muted hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isOwn ? "end" : "start"}
        sideOffset={6}
        className="w-48 rounded-xl p-1.5"
      >
        <DropdownMenuItem
          onClick={() => onReply(message)}
          className="gap-2 rounded-lg px-2.5 py-2"
        >
          <Reply className="h-4 w-4" />
          <span>Reply</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <div className="flex items-center justify-around px-1 py-1">
          {REACTION_OPTIONS.map((reaction) => (
            <button
              key={reaction.type}
              type="button"
              title={reaction.label}
              aria-label={reaction.label}
              onClick={() => {
                onReact(message.id, reaction.type);
                setMenuOpen(false);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center",
                "rounded-full text-base",
                "transition-all duration-150",
                "hover:scale-125 hover:bg-muted",
                myReaction === reaction.type &&
                  "bg-accent ring-1 ring-primary/20",
              )}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
