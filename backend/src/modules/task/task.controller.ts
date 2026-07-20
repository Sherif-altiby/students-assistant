// src/modules/task/task.controller.ts

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { taskService } from './task.service';

export const taskController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.create(req.user!.id, req.body);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: task,
    });
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const history = await taskService.complete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: history,
    });
  }),

  getMyTasks: asyncHandler(async (req: Request, res: Response) => {
    const tasks = await taskService.getMyTasks(req.user!.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: tasks,
    });
  }),

  getHistoryDays: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await taskService.getHistoryDays(req.user!.id, page, limit);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
    });
  }),

  getHistoryDay: asyncHandler(async (req: Request, res: Response) => {
    const date = new Date(req.params.date as string);

    if (isNaN(date.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    date.setHours(0, 0, 0, 0);

    const history = await taskService.getHistoryDayDetails(req.user!.id, date);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: history,
    });
  }),

  getTaskHistory: asyncHandler(async (req: Request, res: Response) => {
    const history = await taskService.getTaskHistory(req.user!.id, req.params.id as string);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: history,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const task = await taskService.update(req.user!.id, req.params.id as string, req.body);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: task,
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await taskService.delete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  getProgress: asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as 'day' | 'week' | 'month') || 'day';

    const progress = await taskService.getProgress(req.user!.id, period);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: progress,
    });
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await taskService.getStats(req.user!.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: stats,
    });
  }),
};
