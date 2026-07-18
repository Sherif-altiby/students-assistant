// src/modules/task/task.schema.ts

import { z } from 'zod';
import { TaskFrequency } from '@prisma/client';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(255, 'Title is too long'),
    frequency: z.enum([TaskFrequency.TODAY, TaskFrequency.EVERY_DAY]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(255).optional(),
    frequency: z.enum([TaskFrequency.TODAY, TaskFrequency.EVERY_DAY]).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task id'),
  }),
  query: z.object({}).optional(),
});

export const deleteTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task id'),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const historyQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
export const progressQuerySchema = z.object({
  query: z.object({
    period: z.enum(['day', 'week', 'month']).optional().default('day'),
  }),
});

export type ProgressQuery = z.infer<typeof progressQuerySchema>['query'];
export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>['query'];
