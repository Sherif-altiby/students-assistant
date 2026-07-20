import { z } from 'zod';

export const createStudyTableSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1, 'Title is required').max(255),
      type: z.enum(['DATE_RANGE', 'NUMBER_OF_DAYS']),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      numberOfDays: z.number().int().positive().optional(),
    })
    .superRefine((data, ctx) => {
      // 1. Enforce required fields based on type
      if (data.type === 'DATE_RANGE') {
        if (!data.startDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'startDate is required',
          });
        }
        if (!data.endDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate is required',
          });
        }
      }

      if (data.type === 'NUMBER_OF_DAYS') {
        if (!data.numberOfDays) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['numberOfDays'],
            message: 'numberOfDays is required',
          });
        }
      }

      // 2. Validate date format (YYYY-MM-DD) and logical order
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (data.startDate) {
        if (!dateRegex.test(data.startDate) || isNaN(new Date(data.startDate).getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['startDate'],
            message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2024-03-01)',
          });
        }
      }

      if (data.endDate) {
        if (!dateRegex.test(data.endDate) || isNaN(new Date(data.endDate).getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2024-03-01)',
          });
        }
      }

      // 3. Ensure endDate is after or equal to startDate if both exist
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start > end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'endDate must be after or equal to startDate',
          });
        }
      }
    }),
});

export const getStudyTableSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid table id'),
  }),

  body: z.object({}).optional(),

  query: z.object({}).optional(),
});

export const deleteStudyTableSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid table id'),
  }),

  body: z.object({}).optional(),

  query: z.object({}).optional(),
});

export const completeLessonSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid('Invalid lesson id'),
  }),

  body: z.object({}).optional(),

  query: z.object({}).optional(),
});

export const updateStudyTableSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().trim().min(1).max(255),
  }),
});

export const addDayContentSchema = z.object({
  params: z.object({ dayId: z.string().uuid() }),
  body: z.object({
    subjects: z.array(
      z.object({
        title: z.string().trim().min(1),
        chapters: z.array(
          z.object({
            title: z.string().trim().min(1),
            lessons: z.array(
              z.object({ title: z.string().trim().min(1) })
            ),
          })
        ),
      })
    ),
  }),
});

export const updateDayContentSchema = z.object({
  params: z.object({ dayId: z.string().uuid() }),
  body: z.object({
    subjects: z.array(
      z.object({
        id: z.string().uuid().optional(), // if provided, update existing; else create new
        title: z.string().trim().min(1),
        chapters: z.array(
          z.object({
            id: z.string().uuid().optional(),
            title: z.string().trim().min(1),
            lessons: z.array(
              z.object({
                id: z.string().uuid().optional(),
                title: z.string().trim().min(1),
              })
            ),
          })
        ),
      })
    ),
  }),
});

export const generatePDFSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid study table ID format'),
  }),
});

export type CreateStudyTableInput = z.infer<typeof createStudyTableSchema>['body'];

export type CompleteLessonInput = z.infer<typeof completeLessonSchema>['params'];
