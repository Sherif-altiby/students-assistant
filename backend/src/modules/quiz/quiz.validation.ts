// src/modules/quiz/quiz.validation.ts
import { z } from 'zod';

const id = z.uuid();

export const createQuizSchema = z.object({
  body: z.object({
    bookId: id,
    message: z.string().trim().min(3).max(500),
  }),
});

export const quizIdSchema = z.object({
  params: z.object({ id }),
});

export const listQuizzesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    bookId: id.optional(),
  }),
});

export const submitQuizSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    // { "<questionId>": "<answer>" }
    answers: z
      .record(z.string(), z.string().max(300))
      .refine((a) => Object.keys(a).length <= 50, 'Too many answers'),
  }),
});

export const attemptSchema = z.object({
  params: z.object({ id, attemptId: id }),
});