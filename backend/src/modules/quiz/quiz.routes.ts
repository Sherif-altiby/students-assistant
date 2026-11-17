// src/modules/quiz/quiz.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { quizController } from './quiz.controller';
import {
  attemptSchema,
  createQuizSchema,
  listQuizzesSchema,
  quizIdSchema,
  submitQuizSchema,
} from './quiz.validation';

export const quizRouter = Router();

quizRouter.use(authenticate);

quizRouter.post('/', validate(createQuizSchema), quizController.create);
quizRouter.get('/', validate(listQuizzesSchema), quizController.list);
quizRouter.get('/:id', validate(quizIdSchema), quizController.getOne);
quizRouter.post('/:id/submit', validate(submitQuizSchema), quizController.submit);
quizRouter.get('/:id/attempts/:attemptId', validate(attemptSchema), quizController.getAttempt);