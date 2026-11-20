// src/components/chat/useDoctorChatSource.ts
"use client";

import { useMemo } from "react";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { useDoctorChat } from "@/hooks/useDoctorChat";
import { getDoctorChat } from "@/lib/doctor-chat";
import type { ChatSource } from "@/types/chat-source";
import type { ChatMessage, ReactionType } from "@/types/chat";
import type { DoctorChatDetail, DoctorChatMessage } from "@/types/doctor-chat";

/** DoctorChatMessage → ChatMessage (shape used by MessageList/MessageBubble). */
function toShared(m: DoctorChatMessage): ChatMessage {
  return {
    id: m.id,
    content: m.content,
    userId: m.senderId,
    replyToId: m.replyTo?.id ?? null,
    createdAt: m.createdAt,
    updatedAt: m.createdAt,
    user: { id: m.sender.id, name: m.sender.name },
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          content: m.replyTo.content,
          user: m.replyTo.sender,
        }
      : null,
    reactions: m.reactions.map((r) => ({
      id: r.id,
      type: r.type,
      userId: r.userId,
    })),
    deliveredAt: m.deliveredAt,
    readAt: m.readAt,
  };
}

export function useDoctorChatSource(chatId: string): ChatSource {
  const currentUserId = useAuthStore((s) => s.user?.id);

  const chat = useDoctorChat(chatId);
  const { data: detail } = useQuery<DoctorChatDetail>({
    queryKey: ["doctor-chat", "detail", chatId],
    queryFn: () => getDoctorChat(chatId),
    enabled: Boolean(chatId),
  });

  const messages = useMemo(() => chat.messages.map(toShared), [chat.messages]);

  // Map replyTo (DoctorChatMessage) to shared shape for MessageInput's banner
  const replyToShared = useMemo(
    () => (chat.replyTo ? toShared(chat.replyTo) : null),
    [chat.replyTo],
  );

  const otherName = detail?.otherUser.name ?? "المحادثة";
  const roleLabel = detail?.otherUser.role === "DOCTOR" ? "دكتور" : "مريض";

  return {
    title: otherName,
    subtitle: roleLabel,
    headerIcon: <MessageCircle size={18} />,
    kind: "private",

    messages,
    isLoading: chat.isLoading,
    isConnected: chat.isConnected,
    isSending: chat.isSending,

    currentUserId,
    bottomRef: chat.bottomRef,

    sendMessage: chat.sendMessage,

    // real react — no more noop
    react: (messageId: string, type: ReactionType) => chat.react(messageId, type),

    replyTo: replyToShared,
    setReplyTo: (shared: ChatMessage | null) => {
      if (!shared) {
        chat.setReplyTo(null);
        return;
      }
      // MessageBubble only has access to the shared message; look up the
      // original DoctorChatMessage so the hook's replyTo state stays typed.
      const original = chat.messages.find((m) => m.id === shared.id) ?? null;
      chat.setReplyTo(original);
    },

    readOnly: detail?.canSend === false,
  };
}