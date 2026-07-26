import { addDays, isBefore, setHours, setMinutes } from "date-fns";
import type { DayOfWeek } from "@prisma/client";
import { supportRepository } from "./support.repository";
import type { CreateRuleInput, UpdateRuleInput } from "./support.schema";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../../utils/AppError";

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

const GENERATION_WINDOW_DAYS = 60;

function combineDateAndTime(date: Date, time: string): Date {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (parts.length !== 2 || Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new BadRequestError(`Invalid time format: "${time}", expected HH:mm`);
  }

  return setMinutes(setHours(date, hours), minutes);
}

export const supportService = {
  // --- Rules ---
  async createRule(doctorId: string, input: CreateRuleInput) {
    const rule = await supportRepository.createRule({
      doctor: { connect: { id: doctorId } },
      type: input.type,
      dayOfWeek: input.dayOfWeek,
      customDate: input.customDate,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    await supportService.generateSlotsForRule(rule.id);
    return rule;
  },

  async listMyRules(doctorId: string) {
    return supportRepository.findRulesByDoctor(doctorId);
  },

  async updateRule(doctorId: string, ruleId: string, input: UpdateRuleInput) {
    const rule = await supportRepository.findRuleById(ruleId);
    if (!rule) throw new NotFoundError("Rule not found");
    if (rule.doctorId !== doctorId) throw new ForbiddenError("Not authorized to modify this rule");

    const updated = await supportRepository.updateRule(ruleId, input);
    if (updated.isActive) {
      await supportService.generateSlotsForRule(ruleId);
    }
    return updated;
  },

  async deleteRule(doctorId: string, ruleId: string) {
    const rule = await supportRepository.findRuleById(ruleId);
    if (!rule) throw new NotFoundError("Rule not found");
    if (rule.doctorId !== doctorId) throw new ForbiddenError("Not authorized to delete this rule");
    return supportRepository.deleteRule(ruleId);
  },

  /**
   * Materializes AvailabilitySlot rows for a rule, up to GENERATION_WINDOW_DAYS
   * ahead. Safe to re-run (e.g. via cron) — relies on the slot's unique
   * [doctorId, startTime] constraint + skipDuplicates to avoid duplicates.
   */
  async generateSlotsForRule(ruleId: string) {
    const rule = await supportRepository.findRuleById(ruleId);
    if (!rule || !rule.isActive) return;

    const today = new Date();
    const horizon = addDays(today, GENERATION_WINDOW_DAYS);
    const candidateDates: Date[] = [];

    if (rule.type === "CUSTOM") {
      if (rule.customDate && !isBefore(rule.customDate, today)) {
        candidateDates.push(rule.customDate);
      }
    } else {
      for (let d = today; isBefore(d, horizon); d = addDays(d, 1)) {
        if (rule.type === "DAILY") {
          candidateDates.push(d);
        } else if (rule.type === "WEEKLY" && rule.dayOfWeek && d.getDay() === DAY_INDEX[rule.dayOfWeek]) {
          candidateDates.push(d);
        }
      }
    }

    const slotsData = candidateDates.map((date) => ({
      doctorId: rule.doctorId,
      ruleId: rule.id,
      startTime: combineDateAndTime(date, rule.startTime),
      endTime: combineDateAndTime(date, rule.endTime),
    }));

    if (slotsData.length > 0) {
      await supportRepository.createManySlots(slotsData);
    }
  },

  /** Called by a daily cron to keep the rolling window populated for all active rules. */
  async regenerateAllActiveRuleSlots() {
    const rules = await supportRepository.findActiveRules();
    await Promise.all(rules.map((r) => supportService.generateSlotsForRule(r.id)));
  },

  // --- Slots ---
  async listOpenSlots(doctorId: string) {
    return supportRepository.findOpenSlotsByDoctor(doctorId, new Date());
  },

  async setMeetingLink(doctorId: string, slotId: string, meetingLink: string) {
    const slot = await supportRepository.findSlotById(slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.doctorId !== doctorId) throw new ForbiddenError("Not authorized to modify this slot");
    return supportRepository.updateSlot(slotId, { meetingLink });
  },

  async completeSession(doctorId: string, slotId: string) {
    const slot = await supportRepository.findSlotWithBooking(slotId);
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.doctorId !== doctorId) throw new ForbiddenError("Not authorized to modify this slot");
    if (!slot.booking || slot.booking.status !== "ACCEPTED") {
      throw new ConflictError("No accepted booking to complete");
    }

    return supportRepository.runTransaction(async (tx) => {
      await tx.availabilitySlot.update({ where: { id: slotId }, data: { status: "COMPLETED" } });
      return tx.sessionBooking.update({
        where: { id: slot.booking!.id },
        data: { status: "COMPLETED" },
      });
    });
  },

  // --- Bookings ---
  async applyToSlot(userId: string, slotId: string) {
    return supportRepository.runTransaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } });
      if (!slot) throw new NotFoundError("Slot not found");
      if (slot.status !== "OPEN") {
        throw new ConflictError("This slot is no longer available");
      }

      const booking = await tx.sessionBooking.create({
        data: { slotId, userId, status: "PENDING" },
      });
      await tx.availabilitySlot.update({ where: { id: slotId }, data: { status: "BOOKED" } });

      return booking;
    });
  },

  async listMyBookings(userId: string) {
    return supportRepository.findBookingsByUser(userId);
  },

  async listBookingsForDoctor(doctorId: string) {
    return supportRepository.findBookingsByDoctor(doctorId);
  },

  async respondToBooking(doctorId: string, bookingId: string, accept: boolean) {
    const booking = await supportRepository.findBookingById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.slot.doctorId !== doctorId) throw new ForbiddenError("Not authorized to respond to this booking");
    if (booking.status !== "PENDING") throw new ConflictError("Booking already responded to");

    return supportRepository.runTransaction(async (tx) => {
      const updated = await tx.sessionBooking.update({
        where: { id: bookingId },
        data: { status: accept ? "ACCEPTED" : "REJECTED", respondedAt: new Date() },
      });

      if (!accept) {
        await tx.availabilitySlot.update({ where: { id: booking.slotId }, data: { status: "OPEN" } });
      }

      return updated;
    });
  },

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await supportRepository.findBookingById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.userId !== userId) throw new ForbiddenError("Not authorized to cancel this booking");
    if (!["PENDING", "ACCEPTED"].includes(booking.status)) {
      throw new ConflictError("Booking cannot be cancelled in its current state");
    }

    return supportRepository.runTransaction(async (tx) => {
      const updated = await tx.sessionBooking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.availabilitySlot.update({ where: { id: booking.slotId }, data: { status: "OPEN" } });
      return updated;
    });
  },

  // --- Ratings ---
  async rateSession(userId: string, bookingId: string, score: number, comment?: string) {
    const booking = await supportRepository.findBookingById(bookingId);
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.userId !== userId) throw new ForbiddenError("Not authorized to rate this booking");
    if (booking.status !== "COMPLETED") {
      throw new ConflictError("Can only rate completed sessions");
    }

    return supportRepository.createRating({
      booking: { connect: { id: bookingId } },
      user: { connect: { id: userId } },
      score,
      comment,
    });
  },
};