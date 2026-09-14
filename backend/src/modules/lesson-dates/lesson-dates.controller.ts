import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { asyncHandler } from '../../utils/asyncHandler';
import { lessonDatesService } from './lesson-dates.service';

export const lessonDatesController = {
  generatePDF: asyncHandler(async (req: Request, res: Response) => {
    const pdfBuffer = await lessonDatesService.generatePDF(req.user!.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=lesson-dates.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(StatusCodes.OK).send(pdfBuffer);
  }),
};
