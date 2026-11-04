import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { createSuggestionSchema, listSuggestionsSchema } from './suggestion.schema';
import { suggestionService } from './suggestion.service';
import { getValidatedRequest } from '../../middlewares/validate';

export const suggestionController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const {
      body: { message },
    } = getValidatedRequest(req, createSuggestionSchema);
    const suggestion = await suggestionService.create(req.user!.id, { message });
    res.status(StatusCodes.CREATED).json({ status: 'success', data: suggestion });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const {
      query: { page, limit, search },
    } = getValidatedRequest(req, listSuggestionsSchema);
    const result = await suggestionService.list({ page, limit, search });
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),
};
