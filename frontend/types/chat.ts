export type ReactionType = "LIKE" | "LOVE" | "SUPPORT";

export interface ChatUser {
  id: string;
  name: string;
}

export interface ChatReaction {
  id: string;
  type: ReactionType;
  userId: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  user: ChatUser;
  replyTo: {
    id: string;
    content: string;
    user: ChatUser;
  } | null;
  reactions: ChatReaction[];
}

export interface SendMessagePayload {
  content: string;
  replyToId?: string;
}

export interface ReactPayload {
  messageId: string;
  type: ReactionType;
}

export interface ReactionUpdatedEvent {
  messageId: string;
  userId: string;
  type: ReactionType | null;
}

export interface SocketAck<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}