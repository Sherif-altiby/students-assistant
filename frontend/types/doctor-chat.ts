// src/types/doctor-chat.ts
export type ChatRole = "DOCTOR" | "STUDENT";
export type ReactionType = "LIKE" | "LOVE" | "SUPPORT";

export interface ChatUser {
  id: string;
  name: string;
  role: ChatRole;
}

export interface ChatReactionDto {
  id: string;
  type: ReactionType;
  userId: string;
}

export interface MessageReplyPreview {
  id: string;
  content: string;
  sender: { id: string; name: string };
}

export interface DoctorChatLastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface DoctorChatListItem {
  id: string;
  otherUser: ChatUser;
  lastMessage: DoctorChatLastMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface DoctorChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  sender: { id: string; name: string };
  replyTo: MessageReplyPreview | null;   // NEW
  reactions: ChatReactionDto[];          // NEW
}

export interface DoctorChatDetail {
  id: string;
  otherUser: ChatUser;
  canSend: boolean;
}

export interface DoctorChatMessagesPage {
  messages: DoctorChatMessage[];
  nextCursor: string | null;
}

export interface SendDoctorChatMessagePayload {
  content: string;
  replyToId?: string;
}

export interface DoctorChatConnectResponse {
  chatId: string;
}

export const DOCTOR_CHAT_EVENTS = {
  MESSAGE_SEND: "doctor-chat:message:send",
  MESSAGE_NEW: "doctor-chat:message:new",
  REACTION_ADD: "doctor-chat:reaction:add",
  REACTION_UPDATED: "doctor-chat:reaction:updated",
  MESSAGE_DELIVERED: "doctor-chat:message:delivered",
  MESSAGE_READ: "doctor-chat:message:read",
  DELIVERED_UPDATED: "doctor-chat:delivered:updated",
  READ_UPDATED: "doctor-chat:read:updated",
  JOIN: "doctor-chat:join",
  LEAVE: "doctor-chat:leave",
  ERROR: "doctor-chat:error",
} as const;

export type DoctorChatEvent =
  (typeof DOCTOR_CHAT_EVENTS)[keyof typeof DOCTOR_CHAT_EVENTS];