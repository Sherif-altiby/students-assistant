// src/modules/doctor-chat/doctor-chat.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { getValidatedRequest } from '../../middlewares/validate';
import { doctorChatService } from './doctor-chat.service';
import {
  bookingIdSchema,
  chatIdSchema,
  listMessagesSchema,
  sendMessageSchema,
  toggleReactionSchema,
} from './doctor-chat.validation';

export const doctorChatController = {
  openFromBooking: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, bookingIdSchema);
    const data = await doctorChatService.openFromBooking(req.user!.id, params.bookingId);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await doctorChatService.listChats(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, chatIdSchema);
    const data = await doctorChatService.getChat(req.user!.id, params.chatId);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  listMessages: asyncHandler(async (req: Request, res: Response) => {
    const { params, query } = getValidatedRequest(req, listMessagesSchema);
    const data = await doctorChatService.listMessages(
      req.user!.id,
      params.chatId,
      query.limit,
      query.before
    );
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = getValidatedRequest(req, sendMessageSchema);
  const { message } = await doctorChatService.sendMessage(
    req.user!.id,
    params.chatId,
    body.content,
    body.replyToId,
  );
  res.status(StatusCodes.CREATED).json({ status: 'success', data: message });
}),

  // REST fallback when the recipient's socket is disconnected —
  // called on window focus / visibility change so ticks don't freeze.
  markDelivered: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, chatIdSchema);
    await doctorChatService.markDelivered(req.user!.id, params.chatId);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, chatIdSchema);
    await doctorChatService.markRead(req.user!.id, params.chatId);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  toggleReaction: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, chatIdSchema);
    const { messageId, type } = toggleReactionSchema.parse(req.body);
    const data = await doctorChatService.reactToMessage(req.user!.id, params.chatId, messageId, type);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),
};