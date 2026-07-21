"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, X, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface MessageInputProps {
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (content: string) => void;
  isSending: boolean;
  disabled?: boolean;
}

const MAX_LENGTH = 2000;

export function MessageInput({
  replyTo,
  onCancelReply,
  onSend,
  isSending,
  disabled,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isSending) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = !disabled && !isSending && value.trim().length > 0;
  const isNearLimit = value.length > MAX_LENGTH - 200;

  return (
    <div className="border-t border-border bg-card px-4 py-3 stick bottom-4">
      <div
        className={cn(
          "rounded-2xl border bg-background transition-colors",
          isFocused ? "border-primary/40 ring-2 ring-ring/30" : "border-input",
          disabled && "opacity-60",
        )}
      >
        <div
          className={cn(
            "grid overflow-hidden transition-all duration-200 ease-out",
            replyTo ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0">
            {replyTo && (
              <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
                <Reply size={13} className="shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">
                    Replying to {replyTo.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{replyTo.content}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancelReply}
                  className="h-6 w-6 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Cancel reply"
                >
                  <X size={13} />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2 p-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={disabled ? "Connecting..." : "Type a message..."}
              disabled={disabled || isSending}
              rows={1}
              className="min-h-[40px] resize-none border-0 bg-transparent p-2 text-sm leading-relaxed shadow-none focus-visible:ring-0"
              style={{ maxHeight: "140px" }}
            />
            {isNearLimit && (
              <span
                className={cn(
                  "pointer-events-none absolute bottom-1 right-1 text-[10px] tabular-nums",
                  value.length >= MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {value.length}/{MAX_LENGTH}
              </span>
            )}
          </div>

          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "h-9 w-9 shrink-0 rounded-full shadow-xs transition-transform",
              canSend && "hover:scale-105 active:scale-95",
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}