import { z } from 'zod';
import { dayCount } from './date-time';

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'يجب إدخال التاريخ بصيغة YYYY-MM-DD');

const id = z.string().uuid();
const subjectScope = z.union([
  z.literal('ALL'),
  z
    .array(id)
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'يجب عدم تكرار المواد'),
]);
const globalSubjectScope = z
  .array(id)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, 'يجب عدم تكرار المواد');
const selectedLessonScope = z
  .array(id)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, 'يجب عدم تكرار الدروس');
const lessonSelection = { selectedLessonIds: selectedLessonScope.optional() };

const monthNames = [
  ['january', 'jan', 'يناير'],
  ['february', 'feb', 'فبراير'],
  ['march', 'mar', 'مارس'],
  ['april', 'apr', 'أبريل', 'ابريل'],
  ['may', 'مايو'],
  ['june', 'jun', 'يونيو'],
  ['july', 'jul', 'يوليو'],
  ['august', 'aug', 'أغسطس', 'اغسطس'],
  ['september', 'sep', 'sept', 'سبتمبر'],
  ['october', 'oct', 'أكتوبر', 'اكتوبر'],
  ['november', 'nov', 'نوفمبر'],
  ['december', 'dec', 'ديسمبر'],
];

export function parseMonth(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12) {
    return value;
  }
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLocaleLowerCase();
  const numeric = Number(normalized);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) return numeric;
  const index = monthNames.findIndex((aliases) => aliases.includes(normalized));
  return index < 0 ? undefined : index + 1;
}

const month = z.preprocess(
  parseMonth,
  z.number().int().min(1).max(12, 'اسم الشهر أو رقمه غير صالح')
);

const title = z.string().trim().min(1).max(255);
const year = z.number().int().min(1900).max(2200);

const weeklyTableSchema = z
  .object({
    title,
    type: z.literal('WEEKLY'),
    startDate: dateOnly,
    subjects: subjectScope,
    ...lessonSelection,
  })
  .strict();
const monthlyTableSchema = z
  .object({
    title,
    type: z.literal('MONTHLY'),
    month,
    year: year.optional(),
    subjects: subjectScope,
    ...lessonSelection,
  })
  .strict();
const customTableSchema = z
  .object({
    title,
    type: z.literal('CUSTOM'),
    startDate: dateOnly,
    endDate: dateOnly,
    subjects: subjectScope,
    ...lessonSelection,
  })
  .strict()
  .refine(
    (value) => {
      const count = dayCount(value.startDate, value.endDate);
      return count >= 1 && count <= 366;
    },
    { path: ['endDate'], message: 'يجب أن تتراوح الفترة المخصصة بين يوم و366 يوماً' }
  );
const globalTableSchema = z
  .object({
    title,
    type: z.literal('GLOBAL'),
    startDate: dateOnly,
    endDate: dateOnly,
    subjects: globalSubjectScope,
    ...lessonSelection,
  })
  .strict()
  .refine(
    (value) => {
      const count = dayCount(value.startDate, value.endDate);
      return count >= 1 && count <= 400;
    },
    { path: ['endDate'], message: 'يجب ألا تتجاوز الخطة الشاملة 400 يوم' }
  );

export const tableFieldsSchema = z.discriminatedUnion('type', [
  weeklyTableSchema,
  monthlyTableSchema,
  customTableSchema,
  globalTableSchema,
]);

const scheduleSchema = z
  .object({
    studyWeekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length, 'يجب عدم تكرار أيام المذاكرة'),
    maxSessionsPerDay: z.number().int().min(1).max(50).default(3),
  })
  .strict();

const generatedBodySchema = z.discriminatedUnion('type', [
  weeklyTableSchema.extend({ schedule: scheduleSchema }).strict(),
  monthlyTableSchema.extend({ schedule: scheduleSchema }).strict(),
  customTableSchema.extend({ schedule: scheduleSchema }).strict(),
  globalTableSchema.extend({ schedule: scheduleSchema }).strict(),
]);

export const createStudyTableSchema = z
  .object({
    body: tableFieldsSchema,
    query: z.object({}).strict().optional(),
    params: z.object({}).strict().optional(),
  })
  .strict();

export const generateStudyTableSchema = z
  .object({
    body: generatedBodySchema,
    query: z.object({ preview: z.enum(['true', 'false']).optional() }).strict(),
    params: z.object({}).strict().optional(),
  })
  .strict();

export const listStudyTablesSchema = z
  .object({
    query: z
      .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
        search: z.string().optional(),
      })
      .strict(),
    body: z.object({}).strict().optional(),
    params: z.object({}).strict().optional(),
  })
  .strict();

export const availableMonthsSchema = z
  .object({
    query: z
      .object({
        count: z.coerce.number().int().positive().max(24).default(12),
      })
      .strict(),
    body: z.object({}).strict().optional(),
    params: z.object({}).strict().optional(),
  })
  .strict();

export const tableIdSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
  })
  .strict();

export const updateStudyTableSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: z
      .object({
        title: title.optional(),
        startDate: dateOnly.optional(),
        endDate: dateOnly.optional(),
        month: month.optional(),
        year: year.optional(),
        subjects: subjectScope.optional(),
      })
      .strict()
      .refine((body) => Object.keys(body).length > 0, 'لم يتم إرسال أي تعديلات'),
  })
  .strict();

const sessionFields = z.object({
  subjectId: id,
  lessonId: id,
  order: z.number().int().min(0).optional(),
});

export const sessionIdSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
  })
  .strict();

export const createSessionSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: sessionFields
      .extend({
        dayId: id.optional(),
        date: dateOnly.optional(),
      })
      .strict()
      .refine((body) => Boolean(body.dayId) !== Boolean(body.date), {
        message: 'يجب تحديد اليوم أو التاريخ فقط',
      }),
  })
  .strict();

export const updateSessionSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: sessionFields
      .partial()
      .extend({
        dayId: id.optional(),
        date: dateOnly.optional(),
      })
      .strict()
      .refine((body) => Object.keys(body).length > 0, 'لم يتم إرسال أي تعديلات'),
  })
  .strict();

export const daySessionsSchema = z
  .object({
    params: z.object({ dayId: id }).strict(),
    body: z
      .object({
        sessions: z.array(sessionFields.strict()),
      })
      .strict(),
    query: z.object({}).strict().optional(),
  })
  .strict();

export const completeSessionSchema = z
  .object({
    params: z.object({ id }).strict(),
    body: z.object({}).strict().optional(),
    query: z.object({}).strict().optional(),
  })
  .strict();

export type Scope = z.infer<typeof subjectScope>;
export type StudyTableInput = z.infer<typeof tableFieldsSchema>;
export type CreateStudyTableInput = StudyTableInput;
export type GenerateScheduleInput = z.infer<typeof scheduleSchema>;
export type GenerateStudyTableInput = z.infer<typeof generateStudyTableSchema>['body'];
export type SessionInput = z.infer<typeof createSessionSchema>['body'];
export type SessionReplaceInput = z.infer<typeof daySessionsSchema>['body']['sessions'][number];
export type StudyTableUpdateInput = z.infer<typeof updateStudyTableSchema>['body'];
