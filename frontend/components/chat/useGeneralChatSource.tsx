// src/components/chat/useGeneralChatSource.ts
"use client";

import { MessageCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import type { ChatSource } from "@/types/chat-source";

export function useGeneralChatSource(): ChatSource {
  const chat = useChat();

  return {
    title: "Study Room",
    subtitle: "غرفة دراسة مباشرة",
    headerIcon: <MessageCircle size={18} />,

    kind: "group", // public room → show sender names/avatars

    messages: chat.messages,
    isLoading: chat.isLoading,
    isConnected: chat.isConnected,
    isSending: chat.isSending,

    currentUserId: chat.currentUserId,
    bottomRef: chat.bottomRef,

    sendMessage: chat.sendMessage,
    react: chat.react,
    replyTo: chat.replyTo,
    setReplyTo: chat.setReplyTo,
  };
} 