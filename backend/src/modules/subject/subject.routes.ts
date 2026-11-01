import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { subjectController } from './subject.controller';
import {
  createLessonSchema,
  createSubjectSchema,
  createUnitSchema,
  deleteLessonSchema,
  deleteSubjectSchema,
  deleteUnitSchema,
  getSubjectSchema,
  listSubjectsSchema,
  reorderLessonsSchema,
  reorderUnitsSchema,
  updateLessonSchema,
  updateSubjectSchema,
  updateUnitSchema,
} from './subject.schema';

const router = Router();
router.use(authenticate);

router.get('/', validate(listSubjectsSchema), subjectController.list);
router.get('/:id', validate(getSubjectSchema), subjectController.getById);

const adminOnly = authorize(Role.ADMIN);
router.post('/', adminOnly, validate(createSubjectSchema), subjectController.create);
router.patch('/:id', adminOnly, validate(updateSubjectSchema), subjectController.update);
router.delete('/:id', adminOnly, validate(deleteSubjectSchema), subjectController.delete);

router.put('/:id/units/order', adminOnly, validate(reorderUnitsSchema), subjectController.reorderUnits);
router.post('/:id/units', adminOnly, validate(createUnitSchema), subjectController.createUnit);
router.patch('/units/:id', adminOnly, validate(updateUnitSchema), subjectController.updateUnit);
router.delete('/units/:id', adminOnly, validate(deleteUnitSchema), subjectController.deleteUnit);

router.put('/units/:id/lessons/order', adminOnly, validate(reorderLessonsSchema), subjectController.reorderLessons);
router.post('/units/:id/lessons', adminOnly, validate(createLessonSchema), subjectController.createLesson);
router.patch('/lessons/:id', adminOnly, validate(updateLessonSchema), subjectController.updateLesson);
router.delete('/lessons/:id', adminOnly, validate(deleteLessonSchema), subjectController.deleteLesson);

export { router as subjectRouter };
