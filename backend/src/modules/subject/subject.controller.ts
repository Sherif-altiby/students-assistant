import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { subjectService } from './subject.service';

export const subjectController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const subjects = await subjectService.listSubjects({
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 10),
    });
    res.status(StatusCodes.OK).json({ status: 'success', data: subjects });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectService.getSubject(req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: subject });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectService.createSubject(req.body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: subject });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectService.updateSubject(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: subject });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.deleteSubject(req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  createUnit: asyncHandler(async (req: Request, res: Response) => {
    const unit = await subjectService.createUnit(req.params.id as string, req.body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: unit });
  }),

  updateUnit: asyncHandler(async (req: Request, res: Response) => {
    const unit = await subjectService.updateUnit(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: unit });
  }),

  deleteUnit: asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.deleteUnit(req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  reorderUnits: asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.reorderUnits(req.params.id as string, req.body.unitIds);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  createLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await subjectService.createLesson(req.params.id as string, req.body.title);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: lesson });
  }),

  updateLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await subjectService.updateLesson(req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: lesson });
  }),

  deleteLesson: asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.deleteLesson(req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  reorderLessons: asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.reorderLessons(req.params.id as string, req.body.lessonIds);
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),
};
