// src/modules/task/task.routes.ts

import { Router } from 'express';
import { taskController } from './task.controller';
import {
  createTaskSchema,
  updateTaskSchema,
  deleteTaskSchema,
  historyQuerySchema,
} from './task.schema';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';

const router = Router();

router.use(authenticate);

// Task CRUD operations
router.post('/', validate(createTaskSchema), taskController.create);
router.get('/', taskController.getMyTasks);
router.put('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', validate(deleteTaskSchema), taskController.delete);

// Task completion
router.post('/:id/complete', taskController.complete);

// Task history routes
router.get('/history', validate(historyQuerySchema), taskController.getHistoryDays);
router.get('/history/:date', taskController.getHistoryDay);
router.get('/:id/history', taskController.getTaskHistory);

export { router as taskRouter };
