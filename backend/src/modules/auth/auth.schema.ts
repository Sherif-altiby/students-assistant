import { z } from 'zod';
import { createUserSchema } from '../user/user.schema';

/** Registration uses the exact same shape/rules as creating a user. */
export const registerSchema = createUserSchema;

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];