// src/modules/doctor-chat/doctor-chat.types.ts

export type ChatRole = 'DOCTOR' | 'STUDENT';

export interface ChatUser {
  id: string;
  name: string;
  role: ChatRole;
}

export type ReactionType = 'LIKE' | 'LOVE' | 'SUPPORT';

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

export interface DoctorChatMessageDto {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  deliveredAt: Date | null;
  readAt: Date | null;
  sender: { id: string; name: string };
  replyTo: MessageReplyPreview | null;   // NEW
  reactions: ChatReactionDto[];          // NEW
}

export interface DoctorChatListItem {
  id: string;
  otherUser: ChatUser;
  lastMessage: { content: string; senderId: string; createdAt: Date } | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

export interface DoctorChatDetail {
  id: string;
  otherUser: ChatUser;
  canSend: boolean;
}

export interface MessagesPage {
  messages: DoctorChatMessageDto[];
  nextCursor: string | null;
}