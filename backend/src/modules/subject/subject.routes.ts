import { Router } from 'express';
import { Role } from '@prisma/client';

import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { subjectController } from './subject.controller';
import {
  createChapterSchema,
  createLessonSchema,
  createSubjectSchema,
  deleteChapterSchema,
  deleteLessonSchema,
  deleteSubjectSchema,
  getSubjectSchema,
  importSubjectSchema,
  updateChapterSchema,
  updateLessonSchema,
  updateSubjectSchema,
} from './subject.schema';

const router = Router();

const adminOnly = authorize(Role.ADMIN);

router.use(authenticate);

// ── Read: any authenticated user (students need the syllabus too) ──
router.get('/', subjectController.list);
router.get('/:id', validate(getSubjectSchema), subjectController.getById);

// ── Write: admin only ──
// Subjects
router.post('/', adminOnly, validate(createSubjectSchema), subjectController.create);
router.post('/import', adminOnly, validate(importSubjectSchema), subjectController.import);
router.patch('/:id', adminOnly, validate(updateSubjectSchema), subjectController.update);
router.delete('/:id', adminOnly, validate(deleteSubjectSchema), subjectController.delete);

// Chapters
router.post(
  '/:subjectId/chapters',
  adminOnly,
  validate(createChapterSchema),
  subjectController.createChapter
);
router.patch(
  '/chapters/:id',
  adminOnly,
  validate(updateChapterSchema),
  subjectController.updateChapter
);
router.delete(
  '/chapters/:id',
  adminOnly,
  validate(deleteChapterSchema),
  subjectController.deleteChapter
);

// Lessons
router.post(
  '/chapters/:chapterId/lessons',
  adminOnly,
  validate(createLessonSchema),
  subjectController.createLesson
);
router.patch(
  '/lessons/:id',
  adminOnly,
  validate(updateLessonSchema),
  subjectController.updateLesson
);
router.delete(
  '/lessons/:id',
  adminOnly,
  validate(deleteLessonSchema),
  subjectController.deleteLesson
);

export { router as subjectRouter };