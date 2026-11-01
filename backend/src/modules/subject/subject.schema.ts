import { z } from 'zod';

const subjectTitle = z.string().trim().min(1, 'اسم المادة مطلوب').max(255);
const unitTitle = z.string().trim().min(1, 'اسم الوحدة مطلوب').max(255);
const lessonTitle = z.string().trim().min(1, 'اسم الدرس مطلوب').max(500);
const id = z.string().uuid();
const order = z.number().int().positive();

const nestedUnit = z.object({
  title: unitTitle,
  lessons: z.array(z.object({ title: lessonTitle }).strict()).optional(),
}).strict();

export const listSubjectsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }).strict(),
  body: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
}).strict();

export const getSubjectSchema = z.object({
  params: z.object({ id }).strict(),
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
}).strict();

export const createSubjectSchema = z.object({
  params: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
  body: z.object({
    title: subjectTitle,
    units: z.array(nestedUnit).optional(),
  }).strict(),
}).strict();

export const updateSubjectSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({ title: subjectTitle }).strict(),
}).strict();

export const deleteSubjectSchema = getSubjectSchema;

export const createUnitSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: nestedUnit,
}).strict();

export const updateUnitSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({
    title: unitTitle.optional(),
    order: order.optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, 'أرسل تعديلاً واحداً على الأقل'),
}).strict();

export const deleteUnitSchema = getSubjectSchema;

export const reorderUnitsSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({
    unitIds: z.array(id).refine((ids) => new Set(ids).size === ids.length, 'لا تكرر الوحدة'),
  }).strict(),
}).strict();

export const createLessonSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({ title: lessonTitle }).strict(),
}).strict();

export const updateLessonSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({
    title: lessonTitle.optional(),
    unitId: id.optional(),
    order: order.optional(),
  }).strict().refine((body) => Object.keys(body).length > 0, 'أرسل تعديلاً واحداً على الأقل'),
}).strict();

export const deleteLessonSchema = getSubjectSchema;

export const reorderLessonsSchema = z.object({
  params: z.object({ id }).strict(),
  query: z.object({}).strict().optional(),
  body: z.object({
    lessonIds: z.array(id).refine((ids) => new Set(ids).size === ids.length, 'لا تكرر الدرس'),
  }).strict(),
}).strict();

export type ListSubjectsQuery = z.infer<typeof listSubjectsSchema>['query'];
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>['body'];
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>['body'];
export type CreateUnitInput = z.infer<typeof createUnitSchema>['body'];
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>['body'];
export type CreateLessonInput = z.infer<typeof createLessonSchema>['body'];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>['body'];
