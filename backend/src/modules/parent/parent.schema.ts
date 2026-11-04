import { z } from 'zod';

export const parentStudentRequestSchema = z.object({
  body: z.object({ studentEmail: z.string().email() }).strict(),
  query: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
}).strict();

export const parentStudentIdSchema = z.object({
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
  params: z.object({ studentId: z.string().uuid() }).strict(),
}).strict();

export const parentLinkIdSchema = z.object({
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
  params: z.object({ id: z.string().uuid() }).strict(),
}).strict();
