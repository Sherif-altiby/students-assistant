import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { habitController } from './habit.controller';
import { createHabitSchema, updateHabitSchema, deleteHabitSchema, habitProgressQuerySchema } from './habit.schema';

const router = Router();


router.use(authenticate);

router.get('/', habitController.getMyHabits);
router.get('/history', habitController.getHistory);  
router.post('/', validate(createHabitSchema), habitController.create);
router.patch('/:id', validate(updateHabitSchema), habitController.update);
router.delete('/:id', validate(deleteHabitSchema), habitController.delete);
router.post('/:id/complete', habitController.complete);
router.get('/progress', validate(habitProgressQuerySchema), habitController.getProgress);


export { router as habitRouter };

