import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userService } from './user.service';
import { asyncHandler } from '../../utils/asyncHandler';

/**
 * Controllers only translate HTTP <-> service calls. No business logic and
 * no direct Prisma access should live here.
 */
export const userController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: user });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getUserById(req.params['id'] as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: user });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 10));

    const result = await userService.listUsers({ page, limit });
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateUser(req.params['id'] as string, req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: user });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUser(req.params['id'] as string);
    res.status(StatusCodes.NO_CONTENT).send();
  }),
};
