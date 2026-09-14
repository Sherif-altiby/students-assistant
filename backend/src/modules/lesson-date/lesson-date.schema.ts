// src/modules/lesson-date/lesson-date.schema.ts

import { z } from 'zod';
import { ARABIC_DAY_NAMES } from './day-mapping';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm", 24h, zero-padded

const dayNameField = z.enum(
  ARABIC_DAY_NAMES as [string, ...string[]],
  'اختر يوماً صحيحاً من الأسبوع'
);

const timeField = z
  .string()
  .regex(TIME_REGEX, 'صيغة الوقت غير صحيحة، استخدم HH:mm');

// Shared refinement: endTime must be strictly after startTime.
// Attached per-schema below since z.object.merge() would lose refinements.
function withTimeOrderCheck<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
    if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      ctx.addIssue({
        code: 'custom',
        message: 'وقت النهاية يجب أن يكون بعد وقت البداية',
        path: ['endTime'],
      });
    }
  });
}

export const createLessonDateSchema = z.object({
  body: withTimeOrderCheck(
    z.object({
      subject: z.string().trim().min(1, 'المادة مطلوبة').max(255, 'اسم المادة طويل جداً'),
      teacher: z.string().trim().min(1, 'اسم المعلم مطلوب').max(255, 'اسم المعلم طويل جداً'),
      dayName: dayNameField,
      startTime: timeField,
      endTime: timeField,
    })
  ),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateLessonDateSchema = z.object({
  body: withTimeOrderCheck(
    z
      .object({
        subject: z.string().trim().min(1).max(255).optional(),
        teacher: z.string().trim().min(1).max(255).optional(),
        dayName: dayNameField.optional(),
        startTime: timeField.optional(),
        endTime: timeField.optional(),
      })
      .refine((data) => Object.keys(data).length > 0, {
        message: 'لا توجد بيانات للتحديث',
      })
  ),
  params: z.object({
    id: z.string().uuid('معرّف غير صالح'),
  }),
  query: z.object({}).optional(),
});

export const deleteLessonDateSchema = z.object({
  params: z.object({
    id: z.string().uuid('معرّف غير صالح'),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export type CreateLessonDateInput = z.infer<typeof createLessonDateSchema>['body'];
export type UpdateLessonDateInput = z.infer<typeof updateLessonDateSchema>['body'];