import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getValidatedRequest } from '../../middlewares/validate';
import { UnauthorizedError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  availableMonthsSchema,
  completeSessionSchema,
  createSessionSchema,
  createStudyTableSchema,
  daySessionsSchema,
  generateStudyTableSchema,
  listStudyTablesSchema,
  sessionIdSchema,
  tableIdSchema,
  updateSessionSchema,
  updateStudyTableSchema,
} from './study-table.schema';
import { studyTableService } from './study-table.service';

function authenticatedUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const studyTableController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { body } = getValidatedRequest(req, createStudyTableSchema);
    const table = await studyTableService.create(authenticatedUserId(req), body);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: table });
  }),

  generate: asyncHandler(async (req: Request, res: Response) => {
    const { body, query } = getValidatedRequest(req, generateStudyTableSchema);
    const result = await studyTableService.generate(
      authenticatedUserId(req),
      body,
      query.preview === 'true'
    );
    res
      .status(query.preview === 'true' ? StatusCodes.OK : StatusCodes.CREATED)
      .json({ status: 'success', data: result });
  }),

  availableMonths: asyncHandler(async (req: Request, res: Response) => {
    const { query } = getValidatedRequest(req, availableMonthsSchema);
    const result = await studyTableService.getAvailableMonths(
      authenticatedUserId(req),
      query.count
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: result });
  }),

  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { query } = getValidatedRequest(req, listStudyTablesSchema);
    const tables = await studyTableService.getMyTables(authenticatedUserId(req), query);
    res.status(StatusCodes.OK).json({ status: 'success', data: tables });
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, tableIdSchema);
    const table = await studyTableService.getById(authenticatedUserId(req), params.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: table });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, updateStudyTableSchema);
    const table = await studyTableService.update(authenticatedUserId(req), params.id, body);
    res.status(StatusCodes.OK).json({ status: 'success', data: table });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, tableIdSchema);
    await studyTableService.delete(authenticatedUserId(req), params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  conflicts: asyncHandler(async (req: Request, res: Response) => {
    const conflicts = await studyTableService.getConflicts(authenticatedUserId(req));
    res.status(StatusCodes.OK).json({ status: 'success', data: conflicts });
  }),

  createSession: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, createSessionSchema);
    const session = await studyTableService.createSession(
      authenticatedUserId(req),
      params.id,
      body
    );
    res.status(StatusCodes.CREATED).json({ status: 'success', data: session });
  }),

  updateSession: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, updateSessionSchema);
    const session = await studyTableService.updateSession(
      authenticatedUserId(req),
      params.id,
      body
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: session });
  }),

  deleteSession: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, sessionIdSchema);
    await studyTableService.deleteSession(authenticatedUserId(req), params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  replaceDaySessions: asyncHandler(async (req: Request, res: Response) => {
    const { params, body } = getValidatedRequest(req, daySessionsSchema);
    const sessions = await studyTableService.replaceDaySessions(
      authenticatedUserId(req),
      params.dayId,
      body.sessions
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: sessions });
  }),

  completeSession: (completed: boolean) =>
    asyncHandler(async (req: Request, res: Response) => {
      const { params } = getValidatedRequest(req, completeSessionSchema);
      const result = await studyTableService.completeSession(
        authenticatedUserId(req),
        params.id,
        completed
      );
      res.status(StatusCodes.OK).json({ status: 'success', data: result });
    }),

  progress: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, tableIdSchema);
    const progress = await studyTableService.getProgress(authenticatedUserId(req), params.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: progress });
  }),

  generatePDF: asyncHandler(async (req: Request, res: Response) => {
    const { params } = getValidatedRequest(req, tableIdSchema);
    const pdfBuffer = await studyTableService.generatePDF(authenticatedUserId(req), params.id);
    const filename = `study-table-${params.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(StatusCodes.OK).send(pdfBuffer);
  }),
};
