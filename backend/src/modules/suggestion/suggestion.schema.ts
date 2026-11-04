import { z } from 'zod';

export const createSuggestionSchema = z.object({
  body: z.object({
    message: z.string().trim().min(5).max(2000),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listSuggestionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().max(200).optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>['body'];
