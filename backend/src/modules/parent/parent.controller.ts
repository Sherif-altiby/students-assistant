import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import { parentService } from './parent.service';

export const parentController = {
  requestStudent: asyncHandler(async (req: Request, res: Response) => {
    const request = await parentService.requestStudent(
      req.user!.id,
      req.body.studentEmail,
    );
    res.status(StatusCodes.CREATED).json({ status: 'success', data: request });
  }),

  listStudents: asyncHandler(async (req: Request, res: Response) => {
    const students = await parentService.listParentStudents(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: students });
  }),

  listRequests: asyncHandler(async (req: Request, res: Response) => {
    const requests = await parentService.listStudentRequests(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: requests });
  }),

  respondToRequest: (approve: boolean) =>
    asyncHandler(async (req: Request, res: Response) => {
      const result = await parentService.respondToRequest(
        req.user!.id,
        req.params.id as string,
        approve,
      );
      res.status(StatusCodes.OK).json({ status: 'success', data: result });
    }),

  studentOverview: asyncHandler(async (req: Request, res: Response) => {
    const overview = await parentService.getStudentOverview(
      req.user!.id,
      req.params.studentId as string,
    );
    res.status(StatusCodes.OK).json({ status: 'success', data: overview });
  }),
};
