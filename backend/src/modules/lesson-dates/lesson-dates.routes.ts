import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { lessonDatesController } from './lesson-dates.controller';

const router = Router();

router.use(authenticate);
router.get('/pdf', lessonDatesController.generatePDF);

export { router as lessonDatesRouter };
