import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { studyTableController } from './study-table.controller';
import {
  availableMonthsSchema,
  completeSessionSchema,
  createSessionSchema,
  createStudyTableSchema,
  daySessionsSchema,
  generateStudyTableSchema,
  listStudyTablesSchema,
  sessionIdSchema,
  tableIdSchema,
  updateSessionSchema,
  updateStudyTableSchema,
} from './study-table.schema';

const router = Router();
router.use(authenticate);

router.get('/conflicts', studyTableController.conflicts);
router.post('/generate', validate(generateStudyTableSchema), studyTableController.generate);
router.get(
  '/available-months',
  validate(availableMonthsSchema),
  studyTableController.availableMonths
);
router.get('/', validate(listStudyTablesSchema), studyTableController.getAll);
router.post('/', validate(createStudyTableSchema), studyTableController.create);

router.patch('/sessions/:id', validate(updateSessionSchema), studyTableController.updateSession);
router.delete('/sessions/:id', validate(sessionIdSchema), studyTableController.deleteSession);
router.post(
  '/sessions/:id/complete',
  validate(completeSessionSchema),
  studyTableController.completeSession(true)
);
router.delete(
  '/sessions/:id/complete',
  validate(completeSessionSchema),
  studyTableController.completeSession(false)
);
router.put(
  '/days/:dayId/sessions',
  validate(daySessionsSchema),
  studyTableController.replaceDaySessions
);

router.get('/:id/progress', validate(tableIdSchema), studyTableController.progress);
router.post('/:id/sessions', validate(createSessionSchema), studyTableController.createSession);
router.get('/:id/pdf', validate(tableIdSchema), studyTableController.generatePDF);
router.get('/:id', validate(tableIdSchema), studyTableController.getOne);
router.patch('/:id', validate(updateStudyTableSchema), studyTableController.update);
router.delete('/:id', validate(tableIdSchema), studyTableController.delete);

export { router as studyTableRouter };
