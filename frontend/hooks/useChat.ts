"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChatHistory } from "@/lib/chat";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  ChatMessage,
  ReactionUpdatedEvent,
  ReactPayload,
  SendMessagePayload,
  SocketAck,
} from "@/types/chat";

const CHAT_EVENTS = {
  MESSAGE_SEND: "message:send",
  MESSAGE_NEW: "message:new",
  REACTION_ADD: "reaction:add",
  REACTION_UPDATED: "reaction:updated",
  ERROR: "chat:error",
} as const;

const HISTORY_KEY = ["chat", "history"] as const;

export function useChat() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () => getChatHistory({ limit: 30 }),
    staleTime: Infinity, // socket keeps this fresh; no need to refetch on focus etc.
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // --- socket lifecycle -----------------------------------------------
  useEffect(() => {
    const socket = connectSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleNewMessage = (message: ChatMessage) => {
      queryClient.setQueryData<ChatMessage[]>(HISTORY_KEY, (old = []) => [
        ...old,
        message,
      ]);
      // only autoscroll if the message is from me, or we're already near bottom
      queueMicrotask(() => scrollToBottom());
    };

    const handleReactionUpdated = (event: ReactionUpdatedEvent) => {
      queryClient.setQueryData<ChatMessage[]>(HISTORY_KEY, (old = []) =>
        old.map((msg) => {
          if (msg.id !== event.messageId) return msg;

          const withoutUser = msg.reactions.filter(
            (r) => r.userId !== event.userId,
          );
          if (!event.type) return { ...msg, reactions: withoutUser };

          return {
            ...msg,
            reactions: [
              ...withoutUser,
              {
                id: `${event.userId}-${event.messageId}`,
                type: event.type,
                userId: event.userId,
              },
            ],
          };
        }),
      );
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(CHAT_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(CHAT_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    socket.on("connect_error", handleConnectError);
    // chat.socket.ts, top of registerChatHandlers
    socket.onAny((event, ...args) => {
      console.log("Server received event:", event, args);
    });

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(CHAT_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(CHAT_EVENTS.REACTION_UPDATED, handleReactionUpdated);
      socket.off("connect_error", handleConnectError);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleConnectError = (err: Error) => {
    console.error("Socket connect_error:", err.message);
    setIsConnected(false);
  };

  // --- actions ----------------------------------------------------------
  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setIsSending(true);
      const payload: SendMessagePayload = {
        content: trimmed,
        replyToId: replyTo?.id,
      };

      getSocket().emit(CHAT_EVENTS.MESSAGE_SEND, payload, (ack: SocketAck) => {
        console.log("SEND ACK:", ack); // temporary debug

        setIsSending(false);
        if (!ack.success) {
          console.error("Failed to send message:", ack.message);
          return;
        }
        setReplyTo(null);
      });
    },
    [replyTo],
  );

  const react = useCallback(
    (messageId: string, type: ReactPayload["type"]) => {
      // optimistic update — server broadcast will reconcile shortly after
      if (currentUserId) {
        queryClient.setQueryData<ChatMessage[]>(HISTORY_KEY, (old = []) =>
          old.map((msg) => {
            if (msg.id !== messageId) return msg;
            const existing = msg.reactions.find(
              (r) => r.userId === currentUserId,
            );
            const withoutUser = msg.reactions.filter(
              (r) => r.userId !== currentUserId,
            );
            const nextType = existing?.type === type ? null : type;
            return {
              ...msg,
              reactions: nextType
                ? [
                    ...withoutUser,
                    {
                      id: `optimistic-${messageId}`,
                      type: nextType,
                      userId: currentUserId,
                    },
                  ]
                : withoutUser,
            };
          }),
        );
      }

      getSocket().emit(CHAT_EVENTS.REACTION_ADD, {
        messageId,
        type,
      } satisfies ReactPayload);
    },
    [currentUserId, queryClient],
  );

  return {
    messages,
    isLoading,
    isConnected,
    isSending,
    currentUserId,
    replyTo,
    setReplyTo,
    sendMessage,
    react,
    bottomRef,
  };
}
