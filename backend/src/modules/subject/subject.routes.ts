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

const subjectEditor = authorize(Role.ADMIN, Role.USER);
router.post('/', subjectEditor, validate(createSubjectSchema), subjectController.create);
router.patch('/:id', subjectEditor, validate(updateSubjectSchema), subjectController.update);
router.delete('/:id', subjectEditor, validate(deleteSubjectSchema), subjectController.delete);

router.put('/:id/units/order', subjectEditor, validate(reorderUnitsSchema), subjectController.reorderUnits);
router.post('/:id/units', subjectEditor, validate(createUnitSchema), subjectController.createUnit);
router.patch('/units/:id', subjectEditor, validate(updateUnitSchema), subjectController.updateUnit);
router.delete('/units/:id', subjectEditor, validate(deleteUnitSchema), subjectController.deleteUnit);

router.put('/units/:id/lessons/order', subjectEditor, validate(reorderLessonsSchema), subjectController.reorderLessons);
router.post('/units/:id/lessons', subjectEditor, validate(createLessonSchema), subjectController.createLesson);
router.patch('/lessons/:id', subjectEditor, validate(updateLessonSchema), subjectController.updateLesson);
router.delete('/lessons/:id', subjectEditor, validate(deleteLessonSchema), subjectController.deleteLesson);

export { router as subjectRouter };
