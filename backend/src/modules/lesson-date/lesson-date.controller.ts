// src/modules/lesson-date/lesson-date.controller.ts

import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { lessonDateService } from './lesson-date.service';
 
export const lessonDateController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonDateService.create(req.user!.id, req.body);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: lesson,
    });
  }),

  getMyLessonDates: asyncHandler(async (req: Request, res: Response) => {
    const lessons = await lessonDateService.getMyLessonDates(req.user!.id);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: lessons,
    });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await lessonDateService.update(req.user!.id, req.params.id as string, req.body);

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: lesson,
    });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await lessonDateService.delete(req.user!.id, req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  generatePDF: asyncHandler(async (req: Request, res: Response) => {
    const pdfBuffer = await lessonDateService.generatePDF(req.user!.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=lesson-dates.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(StatusCodes.OK).send(pdfBuffer);
  }),
};