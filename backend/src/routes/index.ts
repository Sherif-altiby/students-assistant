import { Router } from 'express';
import { userRouter } from '../modules/user/user.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { taskRouter } from '../modules/task/task.routes';
import { habitRouter } from '../modules/habit/habit.routes';
import { studyTableRouter } from '../modules/study-table/study-table.routes';
import { chatRouter } from '../modules/chat/chat.routes';

const router = Router();


router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/task', taskRouter);
router.use('/habit', habitRouter);
router.use('/study-table', studyTableRouter);
router.use('/chat', chatRouter);

export { router as apiRouter };
