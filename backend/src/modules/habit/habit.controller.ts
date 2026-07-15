import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { asyncHandler } from '../../utils/asyncHandler';
import { habitService } from './habit.service';

export const habitController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const habit = await habitService.create(req.user!.id, req.body);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: habit,
    });
  }),

  getMyHabits: asyncHandler(async (req: Request, res: Response) => {
    const habits = await habitService.getMyHabits(req.user!.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: habits,
    });
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const completion = await habitService.complete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: completion,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const habit = await habitService.update(req.user!.id, req.params.id as string, req.body);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: habit,
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await habitService.delete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  // habit.controller.ts
  getHistory: asyncHandler(async (req: Request, res: Response) => {
    // Get query parameters with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const data = await habitService.getHistoryData(req.user!.id, {
      page: validatedPage,
      limit: validatedLimit,
      startDate,
      endDate,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      data,
    });
  }),
};
