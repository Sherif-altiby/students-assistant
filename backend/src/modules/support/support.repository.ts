 import type {
  DoctorAvailabilityRule,
  AvailabilitySlot,
  SessionBooking,
  SessionRating,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

export const supportRepository = {
  // --- Rules ---
  createRule(data: Prisma.DoctorAvailabilityRuleCreateInput): Promise<DoctorAvailabilityRule> {
    return prisma.doctorAvailabilityRule.create({ data });
  },

  findRuleById(id: string): Promise<DoctorAvailabilityRule | null> {
    return prisma.doctorAvailabilityRule.findUnique({ where: { id } });
  },

  findRulesByDoctor(doctorId: string): Promise<DoctorAvailabilityRule[]> {
    return prisma.doctorAvailabilityRule.findMany({
      where: { doctorId },
      orderBy: { createdAt: "desc" },
    });
  },

  findActiveRules(): Promise<DoctorAvailabilityRule[]> {
    return prisma.doctorAvailabilityRule.findMany({ where: { isActive: true } });
  },

  updateRule(id: string, data: Prisma.DoctorAvailabilityRuleUpdateInput): Promise<DoctorAvailabilityRule> {
    return prisma.doctorAvailabilityRule.update({ where: { id }, data });
  },

  deleteRule(id: string): Promise<DoctorAvailabilityRule> {
    return prisma.doctorAvailabilityRule.delete({ where: { id } });
  },

  // --- Slots ---
  createManySlots(data: Prisma.AvailabilitySlotCreateManyInput[]): Promise<Prisma.BatchPayload> {
    return prisma.availabilitySlot.createMany({ data, skipDuplicates: true });
  },

  findSlotById(id: string): Promise<AvailabilitySlot | null> {
    return prisma.availabilitySlot.findUnique({ where: { id } });
  },

  findSlotWithBooking(id: string) {
    return prisma.availabilitySlot.findUnique({ where: { id }, include: { booking: true } });
  },

  findOpenSlotsByDoctor(doctorId: string, fromDate: Date): Promise<AvailabilitySlot[]> {
    return prisma.availabilitySlot.findMany({
      where: { doctorId, status: "OPEN", startTime: { gte: fromDate } },
      orderBy: { startTime: "asc" },
    });
  },

  updateSlot(id: string, data: Prisma.AvailabilitySlotUpdateInput): Promise<AvailabilitySlot> {
    return prisma.availabilitySlot.update({ where: { id }, data });
  },

  // --- Bookings ---
  createBooking(data: Prisma.SessionBookingCreateInput): Promise<SessionBooking> {
    return prisma.sessionBooking.create({ data });
  },

  findBookingById(id: string) {
    return prisma.sessionBooking.findUnique({ where: { id }, include: { slot: true } });
  },

  findBookingsByUser(userId: string) {
    return prisma.sessionBooking.findMany({
      where: { userId },
      include: { slot: true },
      orderBy: { createdAt: "desc" },
    });
  },

  findBookingsByDoctor(doctorId: string) {
    return prisma.sessionBooking.findMany({
      where: { slot: { doctorId } },
      include: { slot: true, user: true },
      orderBy: { createdAt: "desc" },
    });
  },

  updateBooking(id: string, data: Prisma.SessionBookingUpdateInput): Promise<SessionBooking> {
    return prisma.sessionBooking.update({ where: { id }, data });
  },

  // --- Ratings ---
  createRating(data: Prisma.SessionRatingCreateInput): Promise<SessionRating> {
    return prisma.sessionRating.create({ data });
  },

  // --- Transactions (composite operations spanning multiple tables) ---
  runTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  },
};