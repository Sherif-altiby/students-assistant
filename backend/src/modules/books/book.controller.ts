// src/modules/books/book.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { getValidatedRequest } from '../../middlewares/validate';
import { bookService } from './book.service';
import {
  bookIdSchema,
  chatSchema,
  conversationMessagesSchema,
  listBooksSchema,
} from './book.validation';

export const bookController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { query } = getValidatedRequest(req, listBooksSchema);
    const data = await bookService.listMine(req.user!.id, query.page, query.limit);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, bookIdSchema);
    const data = await bookService.getOne(req.user!.id, params.id);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  chat: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, chatSchema);
    const data = await bookService.chat({
      userId: req.user!.id,
      bookId: params.id,
      message: body.message,
      conversationId: body.conversationId,
      newConversation: body.newConversation,
    });
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  listConversations: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, bookIdSchema);
    const data = await bookService.listConversations(req.user!.id, params.id);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),

  listMessages: asyncHandler(async (req: Request, res: Response) => {
    const { params, query } = getValidatedRequest(req, conversationMessagesSchema);
    const data = await bookService.listMessages(req.user!.id, params.id, params.conversationId, query.limit);
    res.status(StatusCodes.OK).json({ status: 'success', data });
  }),
};