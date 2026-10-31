import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { asyncHandler } from '../../utils/asyncHandler';
import { subjectService } from './subject.service';
 
export const subjectController = {
  // ───────────── Subject ─────────────

  list: asyncHandler(async (_req: Request, res: Response) => {
    const subjects = await subjectService.listSubjects();

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
    await subjectService.deleteSubject(req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  import: asyncHandler(async (req: Request, res: Response) => {
    const subject = await subjectService.importSubject(req.body);

    res.status(StatusCodes.CREATED).json({ status: 'success', data: subject });
  }),

  // ───────────── Chapter ─────────────

  createChapter: asyncHandler(async (req: Request, res: Response) => {
    const chapter = await subjectService.createChapter(req.params.subjectId as string, req.body);

    res.status(StatusCodes.CREATED).json({ status: 'success', data: chapter });
  }),

  updateChapter: asyncHandler(async (req: Request, res: Response) => {
    const chapter = await subjectService.updateChapter(req.params.id as string, req.body);

    res.status(StatusCodes.OK).json({ status: 'success', data: chapter });
  }),

  deleteChapter: asyncHandler(async (req: Request, res: Response) => {
    await subjectService.deleteChapter(req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),

  // ───────────── Lesson ─────────────

  createLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await subjectService.createLesson(req.params.chapterId as string, req.body);

    res.status(StatusCodes.CREATED).json({ status: 'success', data: lesson });
  }),

  updateLesson: asyncHandler(async (req: Request, res: Response) => {
    const lesson = await subjectService.updateLesson(req.params.id as string, req.body);

    res.status(StatusCodes.OK).json({ status: 'success', data: lesson });
  }),

  deleteLesson: asyncHandler(async (req: Request, res: Response) => {
    await subjectService.deleteLesson(req.params.id as string);

    res.status(StatusCodes.NO_CONTENT).send();
  }),
};