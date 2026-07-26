import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { userService } from './user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { Role } from '@prisma/client';

const VALID_ROLES = ['USER', 'ADMIN', 'DOCTOR'];

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

    const rawRole =
      typeof req.query['role'] === 'string' ? req.query['role'].toUpperCase() : undefined;
    const role = VALID_ROLES.includes(rawRole as Role) ? (rawRole as Role) : undefined;

    const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : undefined;

    const result = await userService.listUsers({ page, limit, search, role });
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  // Add this to your userController.ts
  listDoctors: asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query['page']) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 10));

    const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : undefined;

    const result = await userService.listDoctors({ page, limit, search });
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

  inviteDoctor: asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.inviteDoctor(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: result });
  }),

  acceptInvitation: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.acceptInvitation(req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: user });
  }),
};
