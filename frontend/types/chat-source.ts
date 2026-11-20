// src/types/chat-source.ts
import type { RefObject } from "react";
import type { ChatMessage, ReactionType } from "@/types/chat";

export interface ChatSource {
  title: string;
  subtitle: string;
  headerIcon: React.ReactNode;

  /** "group" shows sender avatars/names, "private" hides them. */
  kind: "group" | "private";

  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  isSending: boolean;

  currentUserId?: string;
  bottomRef: RefObject<HTMLDivElement | null>;

  sendMessage: (content: string) => void | Promise<void | boolean>;
  react: (messageId: string, type: ReactionType) => void;
  replyTo: ChatMessage | null;
  setReplyTo: (m: ChatMessage | null) => void;

  readOnly?: boolean;
}