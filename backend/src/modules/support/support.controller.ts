import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { supportService } from './support.service';
import {
  createRuleSchema,
  updateRuleSchema,
  applyToSlotSchema,
  respondToBookingSchema,
  setMeetingLinkSchema,
  rateSessionSchema,
  ruleIdParamSchema,
  doctorIdParamSchema,
  bookingIdParamSchema,
  slotIdParamSchema,
} from './support.schema';
import { asyncHandler } from '../../utils/asyncHandler';

export const supportController = {
  // --- Rules (doctor) ---
  createRule: asyncHandler(async (req: Request, res: Response) => {
    const input = createRuleSchema.parse(req.body);
    const doctorId = req.user!.id; // from auth middleware
    const rule = await supportService.createRule(doctorId, input);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: rule });
  }),

  listMyRules: asyncHandler(async (req: Request, res: Response) => {
    const rules = await supportService.listMyRules(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: rules });
  }),

  updateRule: asyncHandler(async (req: Request, res: Response) => {
    const { id } = ruleIdParamSchema.parse(req.params);
    const input = updateRuleSchema.parse(req.body);
    const rule = await supportService.updateRule(req.user!.id, id, input);
    res.status(StatusCodes.OK).json({ status: 'success', data: rule });
  }),

  deleteRule: asyncHandler(async (req: Request, res: Response) => {
    const { id } = ruleIdParamSchema.parse(req.params);
    await supportService.deleteRule(req.user!.id, id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  // --- Slots ---
  listOpenSlots: asyncHandler(async (req: Request, res: Response) => {
    const { doctorId } = doctorIdParamSchema.parse(req.params);
    const slots = await supportService.listOpenSlots(doctorId);
    res.status(StatusCodes.OK).json({ status: 'success', data: slots });
  }),

  setMeetingLink: asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = slotIdParamSchema.parse(req.params);
    const { meetingLink } = setMeetingLinkSchema.parse(req.body);
    const slot = await supportService.setMeetingLink(req.user!.id, slotId, meetingLink);
    res.status(StatusCodes.OK).json({ status: 'success', data: slot });
  }),

  completeSession: asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = slotIdParamSchema.parse(req.params);
    const booking = await supportService.completeSession(req.user!.id, slotId);
    res.status(StatusCodes.OK).json({ status: 'success', data: booking });
  }),

  // --- Bookings ---
  apply: asyncHandler(async (req: Request, res: Response) => {
    const { slotId } = slotIdParamSchema.parse(req.params);
    const { note } = applyToSlotSchema.parse(req.body);
    const booking = await supportService.applyToSlot(req.user!.id, slotId, note);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: booking });
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const bookings = await supportService.listMyBookings(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: bookings });
  }),

  listForDoctor: asyncHandler(async (req: Request, res: Response) => {
    const bookings = await supportService.listBookingsForDoctor(req.user!.id);
    res.status(StatusCodes.OK).json({ status: 'success', data: bookings });
  }),

  respond: asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = bookingIdParamSchema.parse(req.params);
    const { accept } = respondToBookingSchema.parse(req.body);
    const booking = await supportService.respondToBooking(req.user!.id, bookingId, accept);
    res.status(StatusCodes.OK).json({ status: 'success', data: booking });
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = bookingIdParamSchema.parse(req.params);
    const booking = await supportService.cancelBooking(req.user!.id, bookingId);
    res.status(StatusCodes.OK).json({ status: 'success', data: booking });
  }),

  // --- Ratings ---
  rate: asyncHandler(async (req: Request, res: Response) => {
    const { bookingId } = bookingIdParamSchema.parse(req.params);
    const { score, comment } = rateSessionSchema.parse(req.body);
    const rating = await supportService.rateSession(req.user!.id, bookingId, score, comment);
    res.status(StatusCodes.CREATED).json({ status: 'success', data: rating });
  }),
};
