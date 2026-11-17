"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Bot, History, Loader2, Plus, Send, User } from "lucide-react";
import MainButton from "@/components/ui/MainButton";
import { useBookChat } from "@/hooks/useBookChat";

const QUICK_ACTIONS = [
  { label: "لخّص الكتاب", message: "لخّص الكتاب" },
  { label: "اشرح صفحة...", prefill: "اشرح صفحة " },
];

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWindow({ bookId }: { bookId: string }) {
  const {
    messages,
    error,
    isSending,
    send,
    startNewConversation,
    selectConversation,
    conversations,
    activeConversationId,
    isLoadingHistory,
    historyError,
  } = useBookChat(bookId);

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    send(trimmed);
    setInput("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <div
      dir="rtl"
      className="flex h-[calc(100vh-14rem)] min-h-[420px] flex-col rounded-2xl border border-border bg-card"
    >
      <div className="relative flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-bold text-foreground">اسأل عن كتابك</p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            المحادثات السابقة
            {conversations.length > 0 ? ` (${conversations.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            disabled={isSending}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            محادثة جديدة
          </button>
        </div>

        {showHistory && (
          <div className="absolute left-3 top-full z-10 mt-1 max-h-72 w-72 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg">
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                مفيش محادثات سابقة على الكتاب ده
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    selectConversation(c.id);
                    setShowHistory(false);
                  }}
                  className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-right transition-colors hover:bg-muted ${
                    c.id === activeConversationId ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="truncate text-sm font-medium text-foreground">
                    {c.title || "محادثة بدون عنوان"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(c.updatedAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {isLoadingHistory && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-muted/50"
              />
            ))}
          </div>
        )}

        {historyError && (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            تعذر تحميل المحادثات السابقة
          </p>
        )}

        {messages.length === 0 && !isSending && !isLoadingHistory && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Bot className="h-8 w-8" />
            <p className="text-sm font-medium text-foreground">
              اسأل أي سؤال عن الكتاب
            </p>
            <p className="text-xs">
              أو اطلب تلخيصًا، أو شرح صفحة معينة بكتابة رقمها
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isUser = m.role === "USER";
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 ${isUser ? "flex-row" : "flex-row-reverse"}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isUser
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {!isUser && m.citedPages && m.citedPages.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
                    <span className="text-xs text-muted-foreground">
                      المصدر:
                    </span>
                    {m.citedPages.map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        ص {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex flex-row-reverse gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جارٍ البحث في الكتاب...
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-2.5 border-t border-border p-3"
      >
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              disabled={isSending}
              onClick={() => {
                if (a.message) {
                  submit(a.message);
                } else if (a.prefill) {
                  setInput(a.prefill);
                  inputRef.current?.focus();
                }
              }}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={2000}
            placeholder="اكتب سؤالك هنا..."
            disabled={isSending}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
          />
          <MainButton
            type="submit"
            disabled={isSending || !input.trim()}
            className="px-5"
            icon={<Send className="h-4 w-4" />}
            title="إرسال"
          />
        </div>
      </form>
    </div>
  );
}