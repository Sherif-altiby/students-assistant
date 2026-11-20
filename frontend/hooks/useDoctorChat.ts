// src/hooks/useDoctorChat.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connectSocket, getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getDoctorChatMessages,
  markDoctorChatAsRead,
  markDoctorChatDelivered,
} from "@/lib/doctor-chat";
import type { DoctorChatMessage, ReactionType } from "@/types/doctor-chat";
import { DOCTOR_CHAT_EVENTS } from "@/types/doctor-chat";
import type { SocketAck } from "@/types/chat";

const HISTORY_KEY = (chatId: string) =>
  ["doctor-chat", "history", chatId] as const;

const TMP_PREFIX = "tmp-";

export interface UseDoctorChatResult {
  messages: DoctorChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isSending: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  react: (messageId: string, type: ReactionType) => void;
  replyTo: DoctorChatMessage | null;
  setReplyTo: (m: DoctorChatMessage | null) => void;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function useDoctorChat(chatId: string): UseDoctorChatResult {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<DoctorChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── History ─────────────────────────────────────────────
  const { data: messages = [], isLoading } = useQuery<DoctorChatMessage[]>({
    queryKey: HISTORY_KEY(chatId),
    queryFn: async () => {
      const page = await getDoctorChatMessages(chatId);
      return page.messages;
    },
    staleTime: Infinity,
    enabled: Boolean(chatId && !isBootstrapping),
  });

  // ── Auto-scroll on new message ──────────────────────────
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  // ── Mark read on open ───────────────────────────────────
  useEffect(() => {
    if (!chatId || isBootstrapping) return;

    queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) => {
      const now = new Date().toISOString();
      return old.map((m) =>
        m.senderId !== currentUserId && !m.readAt
          ? { ...m, readAt: now, deliveredAt: m.deliveredAt ?? now }
          : m,
      );
    });

    markDoctorChatAsRead(chatId).catch(() => {});
    const socket = getSocket();
    if (socket.connected) socket.emit(DOCTOR_CHAT_EVENTS.MESSAGE_READ, chatId);
  }, [chatId, isBootstrapping, queryClient, currentUserId]);

  // ── Mark delivered/read on tab visibility ───────────────
  useEffect(() => {
    if (!chatId) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      markDoctorChatDelivered(chatId).catch(() => {});
      const socket = getSocket();
      if (socket.connected) {
        socket.emit(DOCTOR_CHAT_EVENTS.MESSAGE_DELIVERED, chatId);
        socket.emit(DOCTOR_CHAT_EVENTS.MESSAGE_READ, chatId);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [chatId]);

  // ── Socket lifecycle ────────────────────────────────────
  useEffect(() => {
    if (isBootstrapping || !accessToken || !chatId) {
      setIsConnected(false);
      return;
    }

    const socket = connectSocket();
    socket.auth = { token: accessToken };
    if (!socket.connected) socket.connect();
    socket.emit(DOCTOR_CHAT_EVENTS.JOIN, chatId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleNewMessage = (message: DoctorChatMessage) => {
      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) => {
        if (old.some((m) => m.id === message.id)) return old;
        const withoutTmp = old.filter(
          (m) =>
            !(
              m.id.startsWith(TMP_PREFIX) &&
              m.senderId === message.senderId &&
              m.content === message.content
            ),
        );
        return [...withoutTmp, message].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });

      if (message.senderId !== currentUserId) {
        socket.emit(DOCTOR_CHAT_EVENTS.MESSAGE_DELIVERED, chatId);
        if (document.visibilityState === "visible") {
          socket.emit(DOCTOR_CHAT_EVENTS.MESSAGE_READ, chatId);
        }
      }
    };

    const handleDeliveredUpdated = (payload: {
      chatId: string;
      deliveredAt: string;
      by: string;
    }) => {
      if (payload.chatId !== chatId) return;
      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) =>
        old.map((m) =>
          m.senderId !== payload.by && !m.deliveredAt
            ? { ...m, deliveredAt: payload.deliveredAt }
            : m,
        ),
      );
    };

    const handleReadUpdated = (payload: {
      chatId: string;
      readAt: string;
      by: string;
    }) => {
      if (payload.chatId !== chatId) return;
      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) =>
        old.map((m) =>
          m.senderId !== payload.by && !m.readAt
            ? { ...m, readAt: payload.readAt, deliveredAt: m.deliveredAt ?? payload.readAt }
            : m,
        ),
      );
    };

    // NEW: reaction updates from the server
    const handleReactionUpdated = (payload: {
      chatId: string;
      messageId: string;
      userId: string;
      type: ReactionType | null;
    }) => {
      if (payload.chatId !== chatId) return;
      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) =>
        old.map((m) => {
          if (m.id !== payload.messageId) return m;
          const withoutUser = m.reactions.filter((r) => r.userId !== payload.userId);
          if (!payload.type) return { ...m, reactions: withoutUser };
          return {
            ...m,
            reactions: [
              ...withoutUser,
              {
                id: `${payload.userId}-${payload.messageId}`,
                type: payload.type,
                userId: payload.userId,
              },
            ],
          };
        }),
      );
    };

    const handleError = () => {};

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(DOCTOR_CHAT_EVENTS.MESSAGE_NEW, handleNewMessage);
    socket.on(DOCTOR_CHAT_EVENTS.DELIVERED_UPDATED, handleDeliveredUpdated);
    socket.on(DOCTOR_CHAT_EVENTS.READ_UPDATED, handleReadUpdated);
    socket.on(DOCTOR_CHAT_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    socket.on(DOCTOR_CHAT_EVENTS.ERROR, handleError);

    setIsConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(DOCTOR_CHAT_EVENTS.MESSAGE_NEW, handleNewMessage);
      socket.off(DOCTOR_CHAT_EVENTS.DELIVERED_UPDATED, handleDeliveredUpdated);
      socket.off(DOCTOR_CHAT_EVENTS.READ_UPDATED, handleReadUpdated);
      socket.off(DOCTOR_CHAT_EVENTS.REACTION_UPDATED, handleReactionUpdated);
      socket.off(DOCTOR_CHAT_EVENTS.ERROR, handleError);
      socket.emit(DOCTOR_CHAT_EVENTS.LEAVE, chatId);
    };
  }, [chatId, accessToken, isBootstrapping, queryClient, currentUserId]);

  // ── Send ────────────────────────────────────────────────
  const sendMessage = useCallback(
    (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!trimmed || !chatId || !currentUserId) return Promise.resolve(false);
      if (isSending) return Promise.resolve(false);

      const tmpId = `${TMP_PREFIX}${Date.now()}`;
      const optimistic: DoctorChatMessage = {
        id: tmpId,
        chatId,
        senderId: currentUserId,
        content: trimmed,
        createdAt: new Date().toISOString(),
        deliveredAt: null,
        readAt: null,
        sender: { id: currentUserId, name: currentUserId },
        replyTo: replyTo
          ? { id: replyTo.id, content: replyTo.content, sender: replyTo.sender }
          : null,
        reactions: [],
      };

      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) => [
        ...old,
        optimistic,
      ]);
      setIsSending(true);

      return new Promise<boolean>((resolve) => {
        getSocket().emit(
          DOCTOR_CHAT_EVENTS.MESSAGE_SEND,
          { chatId, content: trimmed, replyToId: replyTo?.id },
          (ack: SocketAck<DoctorChatMessage>) => {
            setIsSending(false);

            if (!ack.success || !ack.data) {
              queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) =>
                old.filter((m) => m.id !== tmpId),
              );
              resolve(false);
              return;
            }

            const serverMsg = ack.data;
            queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) => {
              const withoutTmp = old.filter((m) => m.id !== tmpId);
              if (withoutTmp.some((m) => m.id === serverMsg.id)) return withoutTmp;
              return [...withoutTmp, serverMsg];
            });

            setReplyTo(null);
            resolve(true);
          },
        );
      });
    },
    [chatId, currentUserId, isSending, replyTo, queryClient],
  );

  // ── React ───────────────────────────────────────────────
  const react = useCallback(
    (messageId: string, type: ReactionType) => {
      if (!chatId || !currentUserId) return;

      // Optimistic toggle
      queryClient.setQueryData<DoctorChatMessage[]>(HISTORY_KEY(chatId), (old = []) =>
        old.map((m) => {
          if (m.id !== messageId) return m;
          const mine = m.reactions.find((r) => r.userId === currentUserId);
          const withoutMine = m.reactions.filter((r) => r.userId !== currentUserId);
          if (mine?.type === type) {
            return { ...m, reactions: withoutMine };
          }
          return {
            ...m,
            reactions: [
              ...withoutMine,
              { id: mine?.id ?? `opt-${messageId}`, type, userId: currentUserId },
            ],
          };
        }),
      );

      getSocket().emit(
        DOCTOR_CHAT_EVENTS.REACTION_ADD,
        { chatId, messageId, type },
        (ack: SocketAck<unknown>) => {
          if (!ack.success) {
            queryClient.invalidateQueries({ queryKey: HISTORY_KEY(chatId) });
          }
        },
      );
    },
    [chatId, currentUserId, queryClient],
  );

  return {
    messages,
    isLoading,
    isConnected,
    isSending,
    sendMessage,
    react,
    replyTo,
    setReplyTo,
    bottomRef,
  };
}