import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { parentController } from './parent.controller';
import {
  parentLinkIdSchema,
  parentStudentIdSchema,
  parentStudentRequestSchema,
} from './parent.schema';

const parentRouter = Router();
parentRouter.use(authenticate, authorize('PARENT'));
parentRouter.get('/students', parentController.listStudents);
parentRouter.post(
  '/students/requests',
  validate(parentStudentRequestSchema),
  parentController.requestStudent,
);
parentRouter.get(
  '/students/:studentId/overview',
  validate(parentStudentIdSchema),
  parentController.studentOverview,
);

const studentParentLinkRouter = Router();
studentParentLinkRouter.use(authenticate, authorize('USER'));
studentParentLinkRouter.get('/requests', parentController.listRequests);
studentParentLinkRouter.post(
  '/:id/approve',
  validate(parentLinkIdSchema),
  parentController.respondToRequest(true),
);
studentParentLinkRouter.post(
  '/:id/reject',
  validate(parentLinkIdSchema),
  parentController.respondToRequest(false),
);

export { parentRouter, studentParentLinkRouter };
