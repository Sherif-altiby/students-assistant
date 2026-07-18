import { z } from 'zod';

export type CreateHabitInput = z.infer<typeof createHabitSchema>['body'];

export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

export const createHabitSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title is too long'),
  }),
});

export const updateHabitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid habit id'),
  }),
  body: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    // removed 'completed' – handled via separate complete endpoint
  }),
});

export const deleteHabitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid habit id'),
  }),
});


export const habitProgressQuerySchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month']).optional().default('day'),
  }),
});

// New: no input needed
export const getHistorySchema = z.object({});
export type HabitProgressQuery = z.infer<typeof habitProgressQuerySchema>['query'];

