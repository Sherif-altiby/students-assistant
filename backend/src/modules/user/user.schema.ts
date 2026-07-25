import { z } from 'zod';

export const genderEnum = z.enum(['MALE', 'FEMALE']);
export const educationLevelEnum = z.enum(['GENERAL_SECONDARY', 'AZHARI_SECONDARY']);
export const trackEnum = z.enum(['SCIENCE_MATH', 'SCIENCE_SCIENCE', 'SCIENCE', 'LITERARY']);

const TRACKS_BY_LEVEL: Record<string, string[]> = {
  GENERAL_SECONDARY: ['SCIENCE_MATH', 'SCIENCE_SCIENCE', 'LITERARY'],
  AZHARI_SECONDARY: ['SCIENCE', 'LITERARY'],
};

const withLevelTrackRule = <T extends { level: string; track: string }>(schema: z.ZodType<T>) =>
  schema.refine((data) => TRACKS_BY_LEVEL[data.level]?.includes(data.track), {
    message: 'Selected track is not valid for the chosen education level',
    path: ['track'],
  });

const phoneRegex = /^\+?[0-9]{8,15}$/;

const baseUserFields = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  gender: genderEnum,
  level: educationLevelEnum,
  track: trackEnum,
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

// --- Student self-signup (unchanged) ---
export const createUserSchema = z.object({
  body: withLevelTrackRule(z.object(baseUserFields)),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

const updateBodySchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    gender: genderEnum.optional(),
    level: educationLevelEnum.optional(),
    track: trackEnum.optional(),
    parentPhone: z
      .string()
      .regex(phoneRegex, 'Invalid parent phone number')
      .optional(),
    country: z.string().min(2).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })
  .refine(
    (data) => {
      if (data.level && data.track) {
        return TRACKS_BY_LEVEL[data.level]?.includes(data.track);
      }
      return true;
    },
    { message: 'Selected track is not valid for the chosen education level', path: ['track'] }
  );

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

// --- Admin invites a doctor ---
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
export type InviteDoctorInput = z.infer<typeof inviteDoctorSchema>['body'];
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>['body'];