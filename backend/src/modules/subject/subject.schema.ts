import { z } from 'zod';

const chapterTitle = z.string().trim().min(1, 'Title is required').max(255, 'Title is too long');
const lessonTitle = z.string().trim().min(1, 'Title is required').max(500, 'Title is too long');
const order = z.number().int().min(0);
const id = (label: string) => z.string().uuid(`Invalid ${label} id`);

// ───────────── Subject ─────────────

export const getSubjectSchema = z.object({
  params: z.object({ id: id('subject') }),
});

export const createSubjectSchema = z.object({
  body: z.object({ title: chapterTitle }),
});

export const updateSubjectSchema = z.object({
  params: z.object({ id: id('subject') }),
  body: z.object({ title: chapterTitle.optional() }),
});

export const deleteSubjectSchema = getSubjectSchema;

// ───────────── Chapter ─────────────

export const createChapterSchema = z.object({
  params: z.object({ subjectId: id('subject') }),
  body: z.object({
    title: chapterTitle,
    order: order.optional(), // omitted => appended after its siblings
    parentId: id('parent chapter').optional(), // omitted => top-level chapter
  }),
});

export const updateChapterSchema = z.object({
  params: z.object({ id: id('chapter') }),
  body: z
    .object({
      title: chapterTitle.optional(),
      order: order.optional(),
      parentId: id('parent chapter').nullable().optional(), // null => move to top level
    })
    .refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
});

export const deleteChapterSchema = z.object({
  params: z.object({ id: id('chapter') }),
});

// ───────────── Lesson ─────────────

export const createLessonSchema = z.object({
  params: z.object({ chapterId: id('chapter') }),
  body: z.object({
    title: lessonTitle,
    order: order.optional(),
    parentId: id('parent lesson').optional(),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({ id: id('lesson') }),
  body: z
    .object({
      title: lessonTitle.optional(),
      order: order.optional(),
      parentId: id('parent lesson').nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
});

export const deleteLessonSchema = z.object({
  params: z.object({ id: id('lesson') }),
});

// ───────────── Bulk import (same shape as the table-of-contents JSON) ─────────────
//
// {
//   "title": "اللغة العربية",
//   "table_of_contents": [
//     { "section": "القراءة العربية", "items": ["الموضوع الأول", ...] },
//     { "section": "الأدب والنصوص", "subsections": [
//         { "section": "أولاً : الشعر ومدارسه", "items": [ { "title": "...", "children": [ ... ] } ] }
//     ] }
//   ]
// }

export type ImportLesson = string | { title: string; children?: ImportLesson[] | undefined };

export interface ImportSection {
  section: string;
  items?: ImportLesson[] | undefined;
  subsections?: ImportSection[] | undefined;
}

const importLessonSchema: z.ZodType<ImportLesson> = z.lazy(() =>
  z.union([
    lessonTitle,
    z.object({
      title: lessonTitle,
      children: z.array(importLessonSchema).optional(),
    }),
  ])
);

const importSectionSchema: z.ZodType<ImportSection> = z.lazy(() =>
  z.object({
    section: chapterTitle,
    items: z.array(importLessonSchema).optional(),
    subsections: z.array(importSectionSchema).optional(),
  })
);

export const importSubjectSchema = z.object({
  body: z.object({
    title: chapterTitle,
    table_of_contents: z.array(importSectionSchema).min(1, 'table_of_contents is empty'),
  }),
});

// ───────────── Types ─────────────

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>['body'];
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>['body'];
export type CreateChapterInput = z.infer<typeof createChapterSchema>['body'];
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>['body'];
export type CreateLessonInput = z.infer<typeof createLessonSchema>['body'];
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>['body'];
export type ImportSubjectInput = z.infer<typeof importSubjectSchema>['body'];