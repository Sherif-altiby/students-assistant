"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowDown } from "lucide-react";
import type { ChatMessage, ReactionType } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId?: string;
  onReact: (messageId: string, type: ReactionType) => void;
  onReply: (message: ChatMessage) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { month: "long", day: "numeric" });
}

export function MessageList({
  messages,
  isLoading,
  currentUserId,
  onReact,
  onReply,
  bottomRef,
}: MessageListProps) {
  const [showJump, setShowJump] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowJump(distance > 300);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-2xl">
          👋
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            It&apos;s quiet in here
          </p>
          <p className="text-xs text-muted-foreground">
            Send the first message to get things going
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        // className="custom-scrollbar h-full overflow-y-auto px-4 py-3"
          className="h-full overflow-y-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

      >
        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const showDivider =
            !prev || dayLabel(prev.createdAt) !== dayLabel(message.createdAt);

          return (
            <div key={message.id}>
              {showDivider && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {dayLabel(message.createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.userId === currentUserId}
                currentUserId={currentUserId}
                onReact={onReact}
                onReply={onReply}
              />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showJump && (
        <button
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-transform hover:scale-105"
        >
          <ArrowDown size={13} />
          New messages
        </button>
      )}
    </div>
  );
}
