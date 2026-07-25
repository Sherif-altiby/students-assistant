import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm", 24h

// Base shape only — no refinements here, so .partial() stays usable.
const ruleBaseSchema = z.object({
  type: z.enum(["DAILY", "WEEKLY", "CUSTOM"]),
  dayOfWeek: z
    .enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"])
    .optional(),
  customDate: z.coerce.date().optional(),
  startTime: z.string().regex(timeRegex, "startTime must be in HH:mm format"),
  endTime: z.string().regex(timeRegex, "endTime must be in HH:mm format"),
});

export const createRuleSchema = ruleBaseSchema
  .refine((v) => v.type !== "WEEKLY" || !!v.dayOfWeek, {
    message: "dayOfWeek is required when type is WEEKLY",
    path: ["dayOfWeek"],
  })
  .refine((v) => v.type !== "CUSTOM" || !!v.customDate, {
    message: "customDate is required when type is CUSTOM",
    path: ["customDate"],
  })
  .refine((v) => v.startTime < v.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

// .partial() on the unrefined base, then re-apply only the checks that still
// make sense when fields are optional (i.e. only validate ordering if both
// times are actually present in this particular update payload).
export const updateRuleSchema = ruleBaseSchema.partial().refine(
  (v) => !v.startTime || !v.endTime || v.startTime < v.endTime,
  { message: "endTime must be after startTime", path: ["endTime"] }
);

export const applyToSlotSchema = z.object({
  note: z.string().max(500).optional(),
});

export const respondToBookingSchema = z.object({
  accept: z.boolean(),
});

export const setMeetingLinkSchema = z.object({
  meetingLink: z.string().url(),
});

export const rateSessionSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const ruleIdParamSchema = z.object({
  id: z.string().uuid("Invalid rule id"),
});

export const slotIdParamSchema = z.object({
  slotId: z.string().uuid("Invalid slot id"),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid("Invalid booking id"),
});

export const doctorIdParamSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor id"),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;