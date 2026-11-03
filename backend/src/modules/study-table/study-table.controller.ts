import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes'; 
import { asyncHandler } from '../../utils/asyncHandler';
import { studyTableService } from './study-table.service';

export const studyTableController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const table = await studyTableService.create(req.user!.id, req.body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: table });
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const result = await studyTableService.generate(
      req.user!.id,
      req.body,
      req.query.preview === 'true'
    );
    res.status(req.query.preview === 'true' ? StatusCodes.OK : StatusCodes.CREATED)
      .json({ status: 'success', data: result });
  }),

  availableMonths: asyncHandler(async (req: Request, res: Response) => {
    const result = await studyTableService.getAvailableMonths(
      req.user!.id,
      Number(req.query.count ?? 12),
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const tables = await studyTableService.getMyTables(req.user!.id, {
      page: Number(req.query.page ?? 1),
      limit: Number(req.query.limit ?? 10),
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    res.status(StatusCodes.OK).json({ status: 'success', data: tables });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const table = await studyTableService.getById(req.user!.id, req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: table });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const table = await studyTableService.update(req.user!.id, req.params.id as string, req.body);
    res.status(StatusCodes.OK).json({ status: 'success', data: table });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await studyTableService.delete(req.user!.id, req.params.id as string);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  conflicts: asyncHandler(async (req: Request, res: Response) => {
    const conflicts = await studyTableService.getConflicts(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: conflicts });
  }),

  createSession: asyncHandler(async (req: Request, res: Response) => {
    const session = await studyTableService.createSession(
      req.user!.id,
      req.params.id as string,
      req.body
    );
    res.status(StatusCodes.CREATED).json({ status: 'success', data: session });
  }),

  updateSession: asyncHandler(async (req: Request, res: Response) => {
    const session = await studyTableService.updateSession(
      req.user!.id,
      req.params.id as string,
      req.body
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: session });
  }),

  deleteSession: asyncHandler(async (req: Request, res: Response) => {
    await studyTableService.deleteSession(req.user!.id, req.params.id as string);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  replaceDaySessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await studyTableService.replaceDaySessions(
      req.user!.id,
      req.params.dayId as string,
      req.body.sessions
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: sessions });
  }),

  completeSession: (completed: boolean) => asyncHandler(async (req: Request, res: Response) => {
    const result = await studyTableService.completeSession(
      req.user!.id,
      req.params.id as string,
      completed
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  progress: asyncHandler(async (req: Request, res: Response) => {
    const progress = await studyTableService.getProgress(req.user!.id, req.params.id as string);
    res.status(StatusCodes.OK).json({ status: 'success', data: progress });
  }),

  generatePDF: asyncHandler(async (req: Request, res: Response) => {
    const pdfBuffer = await studyTableService.generatePDF(req.user!.id, req.params.id as string);
    const filename = `study-table-${req.params.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(StatusCodes.OK).send(pdfBuffer);
  }),
};
