"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getConversationMessages,
  listConversations,
  sendChatMessage,
} from "@/lib/ai-chat";
import type { ChatMessage } from "@/types/ai-chat";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "حدث خطأ، حاول مرة أخرى";
  }
  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع";
}

export function useBookChat(bookId: string) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const initialized = useRef(false); // the latest conversation was picked once
  const forceNew = useRef(false);
  const sending = useRef(false); // stops a background refetch from overwriting a message being sent

  const conversationsQuery = useQuery({
    queryKey: ["book-conversations", bookId],
    queryFn: () => listConversations(bookId),
  });

  const messagesQuery = useQuery({
    queryKey: ["conversation-messages", bookId, activeId],
    queryFn: () => getConversationMessages(bookId, activeId as string),
    enabled: activeId !== null,
  });

  // Same rule as the server: continue the newest conversation that is not archived
  useEffect(() => {
    if (initialized.current || !conversationsQuery.data) return;
    initialized.current = true;
    const latest = conversationsQuery.data.find((c) => !c.archivedAt);
    if (latest) setActiveId(latest.id);
  }, [conversationsQuery.data]);

  // Show the saved messages once they are loaded
  useEffect(() => {
    if (!messagesQuery.data || sending.current) return;
    setMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  const mutation = useMutation({
    mutationFn: (message: string) => {
      const newConversation = forceNew.current;
      forceNew.current = false;
      return sendChatMessage(bookId, {
        message,
        conversationId: newConversation ? undefined : (activeId ?? undefined),
        newConversation,
      });
    },
    onMutate: (message) => {
      sending.current = true;
      setError(null);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "USER", content: message },
      ]);
    },
    onSuccess: (reply) => {
      setActiveId(reply.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: reply.answer,
          citedPages: reply.citedPages,
        },
      ]);
      queryClient.invalidateQueries({
        queryKey: ["book-conversations", bookId],
      });
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", bookId, reply.conversationId],
      });
    },
    onError: (err) => setError(getErrorMessage(err)),
    onSettled: () => {
      sending.current = false;
    },
  });

  function startNewConversation() {
    initialized.current = true;
    forceNew.current = true;
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  function selectConversation(id: string) {
    if (mutation.isPending || id === activeId) return;
    initialized.current = true;
    forceNew.current = false;
    setError(null);
    setMessages([]);
    setActiveId(id);
  }

  return {
    messages,
    error,
    isSending: mutation.isPending,
    send: mutation.mutate,
    startNewConversation,
    selectConversation,
    conversations: conversationsQuery.data ?? [],
    activeConversationId: activeId,
    isLoadingHistory:
      conversationsQuery.isLoading ||
      (activeId !== null && messagesQuery.isLoading),
    historyError: conversationsQuery.isError || messagesQuery.isError,
  };
}