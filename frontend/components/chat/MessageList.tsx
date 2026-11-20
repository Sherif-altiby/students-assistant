// src/components/chat/MessageList.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ArrowDown, MessagesSquare } from "lucide-react";
import type { ChatMessage, ReactionType } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentUserId?: string;
  /** Forwarded to MessageBubble. Default true (group chat). */
  showSender?: boolean;
  onReact: (messageId: string, type: ReactionType) => void;
  onReply: (message: ChatMessage) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}

const JUMP_THRESHOLD_PX = 300;
const SAME_SENDER_WINDOW_MS = 5 * 60 * 1000;

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "اليوم";
  if (sameDay(date, yesterday)) return "الأمس";
  return date.toLocaleDateString("ar-EG", { month: "long", day: "numeric" });
}

function isSameGroup(prev: ChatMessage | undefined, curr: ChatMessage): boolean {
  if (!prev) return false;
  if (prev.userId !== curr.userId) return false;
  if (dayKey(prev.createdAt) !== dayKey(curr.createdAt)) return false;
  const gap =
    new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return gap < SAME_SENDER_WINDOW_MS;
}

export function MessageList({
  messages,
  isLoading,
  currentUserId,
  showSender = true,
  onReact,
  onReply,
  bottomRef,
}: MessageListProps) {
  const [showJump, setShowJump] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSeenCountRef = useRef(messages.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distance < JUMP_THRESHOLD_PX;
      setShowJump(!nearBottom);
      if (nearBottom) {
        lastSeenCountRef.current = messages.length;
        setUnreadBelow(0);
      }
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  useEffect(() => {
    if (!showJump) {
      lastSeenCountRef.current = messages.length;
      setUnreadBelow(0);
      return;
    }
    const delta = messages.length - lastSeenCountRef.current;
    setUnreadBelow(delta > 0 ? delta : 0);
  }, [messages.length, showJump]);

  const grouped = useMemo(
    () =>
      messages.map((m, i) => ({
        message: m,
        showDivider:
          !messages[i - 1] ||
          dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt),
        isFirstInGroup: !isSameGroup(messages[i - 1], m),
      })),
    [messages],
  );

  if (isLoading) {
    return <MessageListSkeleton />;
  }

  if (messages.length === 0) {
    return <MessageListEmpty />;
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 py-4 pb-8 chat-background [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {grouped.map(({ message, showDivider, isFirstInGroup }, i) => (
          <div key={`${i}-${message.id}`}>
            {showDivider && (
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="rounded-full bg-card/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                  {dayLabel(message.createdAt)}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            )}
            <MessageBubble
              message={message}
              isOwn={message.userId === currentUserId}
              currentUserId={currentUserId}
              isFirstInGroup={isFirstInGroup}
              showSender={showSender}
              onReact={onReact}
              onReply={onReply}
            />
          </div>
        ))}
        <div ref={bottomRef} className="h-1" aria-hidden />
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() =>
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
          }
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
          aria-label={
            unreadBelow > 0
              ? `${unreadBelow} رسائل جديدة`
              : "الانتقال لآخر الرسائل"
          }
        >
          <ArrowDown size={13} />
          {unreadBelow > 0 ? (
            <span>{unreadBelow} جديدة</span>
          ) : (
            <span>آخر الرسائل</span>
          )}
        </button>
      )}
    </div>
  );
}

function MessageListEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <MessagesSquare className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">لا توجد رسائل بعد</p>
        <p className="text-xs text-muted-foreground">
          اكتب أول رسالة لبدء المحادثة
        </p>
      </div>
    </div>
  );
}

function MessageListSkeleton() {
  return (
    <div className="flex-1 overflow-hidden px-4 py-4 chat-background">
      <div className="space-y-4">
        {[
          { own: false, widths: ["w-2/5", "w-1/3"] },
          { own: true, widths: ["w-1/4"] },
          { own: false, widths: ["w-1/2", "w-1/4", "w-2/5"] },
          { own: true, widths: ["w-1/3"] },
        ].map((group, gi) => (
          <div key={gi} className="space-y-1.5">
            {group.widths.map((w, i) => (
              <div
                key={i}
                className={[
                  "flex items-start gap-2.5",
                  group.own ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                {!group.own && i === 0 && (
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                )}
                {!group.own && i > 0 && <div className="w-8 shrink-0" />}
                <div
                  className={[
                    "h-9 animate-pulse rounded-lg bg-muted/70",
                    w,
                    group.own ? "rounded-tr-none" : "rounded-tl-none",
                  ].join(" ")}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}