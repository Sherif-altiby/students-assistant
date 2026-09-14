// src/modules/lesson-date/lesson-date.routes.ts

import { Router } from 'express';
import { lessonDateController } from './lesson-date.controller';
 
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createLessonDateSchema, deleteLessonDateSchema, updateLessonDateSchema } from './lesson-date.schema';

const router = Router();

router.use(authenticate);

router.get('/pdf', lessonDateController.generatePDF);
router.post('/', validate(createLessonDateSchema), lessonDateController.create);
router.get('/', lessonDateController.getMyLessonDates);
router.put('/:id', validate(updateLessonDateSchema), lessonDateController.update);
router.delete('/:id', validate(deleteLessonDateSchema), lessonDateController.delete);

export { router as lessonDateRouter };