// src/modules/quiz/quiz.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { getValidatedRequest } from '../../middlewares/validate';
import { quizService } from './quiz.service';
import {
  attemptSchema,
  createQuizSchema,
  listQuizzesSchema,
  quizIdSchema,
  submitQuizSchema,
} from './quiz.validation';

export const quizController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { body } = getValidatedRequest(req, createQuizSchema);
    const data = await quizService.create(req.user!.id, body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { query } = getValidatedRequest(req, listQuizzesSchema);
    const data = await quizService.list(req.user!.id, query.page, query.limit, query.bookId);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, quizIdSchema);
    const data = await quizService.getOne(req.user!.id, params.id);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, submitQuizSchema);
    const data = await quizService.submit(req.user!.id, params.id, body.answers);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  getAttempt: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, attemptSchema);
    const data = await quizService.getAttempt(req.user!.id, params.id, params.attemptId);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),
};