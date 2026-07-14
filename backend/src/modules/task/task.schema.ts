import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(255, 'Title is too long'),

    frequency: z.enum([
      'TODAY',
      'EVERY_DAY',
    ]),
  }),

  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .optional(),

    frequency: z
      .enum(['TODAY', 'EVERY_DAY'])
      .optional(),
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

export type CreateTaskInput =
  z.infer<typeof createTaskSchema>['body'];

export type UpdateTaskInput =
  z.infer<typeof updateTaskSchema>;