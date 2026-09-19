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
  /**
   * True for the first message of a run from the same sender.
   * Only that message gets the avatar, sender name and bubble tail,
   * like WhatsApp. Defaults to true so existing usage keeps working.
   */
  isFirstInGroup?: boolean;
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

/* Each sender gets a stable accent color, like in WhatsApp groups.
   Classes are written out in full so Tailwind can see them. */
const SENDER_COLORS = [
  { text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500" },
  { text: "text-sky-600 dark:text-sky-400", border: "border-sky-500" },
  { text: "text-violet-600 dark:text-violet-400", border: "border-violet-500" },
  { text: "text-rose-600 dark:text-rose-400", border: "border-rose-500" },
  { text: "text-amber-600 dark:text-amber-400", border: "border-amber-500" },
  { text: "text-teal-600 dark:text-teal-400", border: "border-teal-500" },
  { text: "text-fuchsia-600 dark:text-fuchsia-400", border: "border-fuchsia-500" },
  { text: "text-orange-600 dark:text-orange-400", border: "border-orange-500" },
];

function getSenderColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* The little corner "tail" of a WhatsApp bubble.
   Colored with currentColor so it always matches the bubble. */
const TAIL_INCOMING =
  "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z";
const TAIL_OUTGOING =
  "M6.467 3.568 0 12.193V1h5.188c1.77 0 2.338 1.156 1.279 2.568z";

function BubbleTail({ isOwn }: { isOwn: boolean }) {
  const d = isOwn ? TAIL_OUTGOING : TAIL_INCOMING;

  return (
    <svg
      aria-hidden
      viewBox="0 0 8 13"
      width="8"
      height="13"
      className={cn(
        "pointer-events-none absolute top-0 overflow-visible fill-current",
        isOwn ? "-right-2 text-primary" : "-left-2 text-card",
      )}
    >
      {/* soft shadow, same as the bubble's */}
      <path d={d} fill="#0b141a" opacity=".13" transform="translate(0 .5)" />
      <path d={d} />
    </svg>
  );
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  isFirstInGroup = true,
  onReact,
  onReply,
}: MessageBubbleProps) {
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

  const time = formatTime(message.createdAt);
  const hasReactions = message.reactions.length > 0;
  const showTail = isFirstInGroup;
  const showSenderName = !isOwn && isFirstInGroup;
  const senderColor = getSenderColor(message.user.name);
  const replyColor = message.replyTo
    ? getSenderColor(message.replyTo.user.name)
    : null;

  return (
    <div
      dir="ltr"
      className={cn(
        "flex w-full items-start gap-2.5 px-3",
        isOwn ? "justify-end" : "justify-start",
        isFirstInGroup ? "mt-2" : "mt-0.5",
      )}
    >
      {/* Avatar column (incoming only). Consecutive messages keep the
          same indent through an empty spacer the size of the avatar. */}
      {!isOwn &&
        (isFirstInGroup ? (
          <div className="shrink-0">
            <Avatar userId={message.userId} name={message.user.name} />
          </div>
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        ))}

      <div
        className={cn(
          "flex min-w-0 max-w-[min(80%,520px)] flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "group relative min-w-0 rounded-lg px-2.5 py-1.5 text-sm",
            "shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground",
            showTail && (isOwn ? "rounded-tr-none" : "rounded-tl-none"),
          )}
        >
          {showTail && <BubbleTail isOwn={isOwn} />}

          {/* Hover chevron, tucked into the bubble's top-right corner */}
          <div
            className={cn(
              "absolute right-1 top-1 z-10 flex items-center pl-6",
              "bg-gradient-to-l via-50% to-transparent",
              isOwn ? "from-primary via-primary" : "from-card via-card",
              "opacity-0 transition-opacity duration-150",
              "focus-within:opacity-100 group-hover:opacity-100",
              "[@media(hover:none)]:opacity-100",
              menuOpen && "opacity-100",
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

          {/* Sender name, colored per user */}
          {showSenderName && (
            <p
              className={cn(
                "mb-0.5 truncate pr-5 text-[13px] font-medium leading-snug",
                senderColor.text,
              )}
            >
              {message.user.name}
            </p>
          )}

          {/* Reply preview */}
          {message.replyTo && replyColor && (
            <div
              className={cn(
                "mb-1 overflow-hidden rounded-md border-l-4 px-2.5 py-1",
                isOwn
                  ? "border-primary-foreground/60 bg-primary-foreground/10"
                  : ["bg-muted/70", replyColor.border],
              )}
            >
              <p
                className={cn(
                  "truncate text-[12.5px] font-medium leading-snug",
                  isOwn ? "text-primary-foreground" : replyColor.text,
                )}
              >
                {message.replyTo.user.name}
              </p>

              <p
                className={cn(
                  "line-clamp-2 text-[13px] leading-snug",
                  isOwn
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {message.replyTo.content}
              </p>
            </div>
          )}

       
          <p className="whitespace-pre-wrap break-words leading-[1.35] md:text-lg">
            {message.content}
            <span
              aria-hidden
              className="invisible ml-2 inline-block select-none text-[11px] leading-none"
            >
              {time}
            </span>
          </p>

          <time
            dateTime={message.createdAt}
            className={cn(
              "absolute bottom-1.5 right-2.5 select-none whitespace-nowrap text-[11px] leading-none",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {time}
          </time>
        </div>

        {/* Reactions, overlapping the bubble's bottom edge */}
        <div
          className={cn(
            "relative z-10 px-1.5",
            hasReactions && "-mt-1.5 mb-0.5",
          )}
        >
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
      <DropdownMenuTrigger
        aria-label="Message actions"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          isOwn
            ? "text-primary-foreground/70 hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ChevronDown className="h-4 w-4" />
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