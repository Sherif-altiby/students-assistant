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
    const completion = await taskService.complete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: completion,
    });
  }),

  getMyTasks: asyncHandler(async (req: Request, res: Response) => {
    const tasks = await taskService.getMyTasks(req.user!.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: tasks,
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
};
