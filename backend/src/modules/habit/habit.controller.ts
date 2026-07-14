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

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const data = await habitService.getHistoryData(req.user!.id);
    res.status(StatusCodes.OK).json({
      status: 'success',
      data,
    });
  }),
};
