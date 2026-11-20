// src/modules/doctor-chat/doctor-chat.validation.ts
import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 2000;
const id = z.uuid();

export const messageContentSchema = z.string().trim().min(1).max(MAX_MESSAGE_LENGTH);

export const bookingIdSchema = z.object({
  params: z.object({ bookingId: id }),
});

export const chatIdSchema = z.object({
  params: z.object({ chatId: id }),
});

export const listMessagesSchema = z.object({
  params: z.object({ chatId: id }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    before: id.optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({ chatId: id }),
  body: z.object({
    content: messageContentSchema,
    replyToId: id.optional(),   // NEW
  }),
});

// NEW: socket/ REST reaction payload
export const reactionTypeSchema = z.enum(['LIKE', 'LOVE', 'SUPPORT']);

export const toggleReactionSchema = z.object({
  messageId: id,
  type: reactionTypeSchema,
});