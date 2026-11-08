import { z } from 'zod';

export const genderEnum = z.enum(['MALE', 'FEMALE']);
const phoneRegex = /^\+?[0-9]{8,15}$/;

const baseUserFields = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  gender: genderEnum,
  parentPhone: z
    .string()
    .min(8, 'Invalid parent phone number')
    .regex(phoneRegex, 'Invalid parent phone number'),
  phone: z
    .string()
    .min(8, 'Invalid phone number')
    .regex(phoneRegex, 'Invalid phone number'),
  country: z.string().min(2, 'Country is required'),
};

// --- Student self-signup ---
export const createUserSchema = z.object({
  body: z.object(baseUserFields),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const updateBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    gender: genderEnum.optional(),
    parentPhone: z
      .string()
      .regex(phoneRegex, 'Invalid parent phone number')
      .optional(),
    country: z.string().min(2).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateUserSchema = z.object({
  body: updateBodySchema,
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid user id'),
  }),
});

export const getUserSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid('Invalid user id'),
  }),
});

// --- Admin creates a doctor account ---
export const createDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// --- Admin invites a doctor by email ---
export const inviteDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .min(8, 'Invalid phone number')
      .regex(phoneRegex, 'Invalid phone number'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

// --- Doctor accepts the invite and sets their password ---
export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Invalid or missing invitation token'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type CreateDoctorInput = z.infer<typeof createDoctorSchema>['body'];
export type InviteDoctorInput = z.infer<typeof inviteDoctorSchema>['body'];
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>['body'];