import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';

import { taskController } from './task.controller';

import { createTaskSchema, updateTaskSchema, deleteTaskSchema } from './task.schema';

const router = Router();

router.use(authenticate);

router.get('/', taskController.getMyTasks);
router.post('/', validate(createTaskSchema), taskController.create);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', validate(deleteTaskSchema), taskController.delete);
router.post('/:id/complete', taskController.complete);

export { router as taskRouter };
