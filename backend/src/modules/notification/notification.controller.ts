import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { notificationService } from './notification.service';

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const notifications = await notificationService.list(req.user!.id, page, limit);
    res.status(StatusCodes.OK).json({ status: 'success', data: notifications });
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const unreadCount = await notificationService.unreadCount(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: { unreadCount } });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markRead(req.user!.id, req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: notification });
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAllRead(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),
};
