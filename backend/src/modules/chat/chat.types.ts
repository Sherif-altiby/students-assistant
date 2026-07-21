import { ReactionType } from "@prisma/client";

export interface SendMessageInput {
  userId: string;
  content: string;
  replyToId?: string;
}

export interface ReactInput {
  userId: string;
  messageId: string;
  type: ReactionType;
}

export interface MessageWithRelations {
  id: string;
  content: string;
  userId: string;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string };
  replyTo: { id: string; content: string; user: { id: string; name: string } } | null;
  reactions: { id: string; type: ReactionType; userId: string }[];
}