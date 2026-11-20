// src/components/chat/MessageStatus.tsx
"use client";

import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  isOwn: boolean;
  deliveredAt?: string | null;
  readAt?: string | null;
  isOptimistic?: boolean;
  className?: string;
}

/**
 * WhatsApp-style status indicator.
 *   ⏱  optimistic (not yet acked)
 *   ✓  sent (server has it, recipient hasn't received)
 *   ✓✓ grey   delivered (recipient's socket got it)
 *   ✓✓ blue   read (recipient called markRead)
 */
export function MessageStatus({
  isOwn,
  deliveredAt,
  readAt,
  isOptimistic,
  className,
}: MessageStatusProps) {
  if (!isOwn) return null;

  if (isOptimistic) {
    return (
      <Clock
        aria-label="Sending"
        className={cn("h-3.5 w-3.5 text-primary-foreground/60", className)}
      />
    );
  }

  if (readAt) {
    return (
      <CheckCheck
        aria-label="Read"
        className={cn("h-3.5 w-3.5 text-sky-300", className)}
      />
    );
  }

  if (deliveredAt) {
    return (
      <CheckCheck
        aria-label="Delivered"
        className={cn("h-3.5 w-3.5 text-primary-foreground/60", className)}
      />
    );
  }

  return (
    <Check
      aria-label="Sent"
      className={cn("h-3.5 w-3.5 text-primary-foreground/60", className)}
    />
  );
}