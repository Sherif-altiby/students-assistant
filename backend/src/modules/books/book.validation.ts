// src/modules/books/book.validation.ts
import { z } from 'zod';

const id = z.uuid();

export const listBooksSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const bookIdSchema = z.object({
  params: z.object({ id }),
});

export const chatSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    message: z.string().trim().min(1).max(2000),
    conversationId: id.optional(),
    newConversation: z.boolean().optional(),
  }),
});

export const conversationMessagesSchema = z.object({
  params: z.object({ id, conversationId: id }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});