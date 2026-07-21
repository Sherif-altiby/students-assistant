import { z } from "zod";
import { ReactionType } from "@prisma/client";

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000),
  replyToId: z.string().uuid().optional(),
});

export const reactSchema = z.object({
  messageId: z.string().uuid(),
  type: z.nativeEnum(ReactionType),
});

export const getHistorySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type ReactDto = z.infer<typeof reactSchema>;
export type GetHistoryDto = z.infer<typeof getHistorySchema>;