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

// New: no input needed
export const getHistorySchema = z.object({});
