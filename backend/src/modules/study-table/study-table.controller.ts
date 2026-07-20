import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { asyncHandler } from '../../utils/asyncHandler';
import { studyTableService } from './study-table.service';

export const studyTableController = {
  create: asyncHandler(async (req, res) => {
    const table = await studyTableService.create(req.user!.id, req.body);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: table,
    });
  }),

  // study-table.controller.ts
  getAll: asyncHandler(async (req: Request, res: Response) => {
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const tables = await studyTableService.getMyTables(req.user!.id, {
      page: validatedPage,
      limit: validatedLimit,
      search: search?.trim(),
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: tables,
    });
  }),

  getOne: asyncHandler(async (req, res) => {
    const table = await studyTableService.getById(req.user!.id, req.params.id as string);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: table,
    });
  }),

  completeLesson: asyncHandler(async (req: Request, res: Response) => {
    const completion = await studyTableService.completeLesson(
      req.user!.id,
      req.params.lessonId as string
    );

    res.status(StatusCodes.CREATED).json({ status: 'success', data: completion });
  }),

  delete: asyncHandler(async (req, res) => {
    await studyTableService.delete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  updateTitle: asyncHandler(async (req, res) => {
    const table = await studyTableService.updateTitle(
      req.user!.id,
      req.params.id as string,
      req.body.title
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: table });
  }),

  addDayContent: asyncHandler(async (req, res) => {
    await studyTableService.addDayContent(
      req.user!.id,
      req.params.dayId as string,
      req.body.subjects
    );
    res.status(StatusCodes.CREATED).json({ status: 'success' });
  }),

  replaceDayContent: asyncHandler(async (req, res) => {
    const updatedDay = await studyTableService.replaceDayContent(
      req.user!.id,
      req.params.dayId as string,
      req.body.subjects
    );
    res.status(StatusCodes.OK).json({
      status: 'success',
      data: updatedDay,
    });
  }),

  generatePDF: asyncHandler(async (req: Request, res: Response) => {
    const pdfBuffer = await studyTableService.generatePDF(req.user!.id, req.params.id as string);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=study-table-${req.params.id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(StatusCodes.OK).send(pdfBuffer);
  }),
};
