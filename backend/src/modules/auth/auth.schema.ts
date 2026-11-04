import { z } from 'zod';
import { createUserSchema } from '../user/user.schema';

/** Registration uses the exact same shape/rules as creating a user. */
export const registerSchema = createUserSchema;

export const registerParentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(8).max(16).regex(/^\+?[0-9]{8,15}$/),
  }).strict(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];