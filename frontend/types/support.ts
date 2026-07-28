/* ------------------------------------------------------------------ */
/* Shared envelopes                                                     */
/* ------------------------------------------------------------------ */

export interface ItemResponse<T> {
  status: "success";
  data: T;
}

export interface ListResponse<T> {
  status: "success";
  data: T[];
}

/* ------------------------------------------------------------------ */
/* Availability rules                                                   */
/* ------------------------------------------------------------------ */

export type AvailabilityRuleType = "DAILY" | "WEEKLY" | "CUSTOM";

export type DayOfWeek =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

interface DailyRulePayload {
  type: "DAILY";
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

interface WeeklyRulePayload {
  type: "WEEKLY";
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

interface CustomRulePayload {
  type: "CUSTOM";
  customDate: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
}

export type CreateAvailabilityRulePayload =
  | DailyRulePayload
  | WeeklyRulePayload
  | CustomRulePayload;

export type UpdateAvailabilityRulePayload = CreateAvailabilityRulePayload;

export interface AvailabilityRule {
  id: string;
  doctorId: string;
  type: AvailabilityRuleType;
  dayOfWeek: DayOfWeek | null;
  customDate: string | null;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Slots                                                                */
/* ------------------------------------------------------------------ */

export type SlotStatus = "OPEN" | "BOOKED" | "COMPLETED" | "CANCELLED";

export interface Slot {
  id: string;
  doctorId: string;
  ruleId: string | null;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  meetingLink: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Bookings                                                             */
/* ------------------------------------------------------------------ */

export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  status: BookingStatus;
  note: string | null;
  requestedAt: string;
  respondedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  gender: string;
  level: string;
  track: string;
  parentPhone: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithSlot extends Booking {
  slot: Slot;
}

export interface BookingWithSlotAndUser extends BookingWithSlot {
  user: BookingUser;
}

/* ------------------------------------------------------------------ */
/* Doctors directory                                                    */
/* ------------------------------------------------------------------ */

export interface DoctorSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  gender: string | null;
  level: string | null;
  track: string | null;
  parentPhone: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListDoctorsParams {
  page?: number;
  limit?: number;
}

export interface ListDoctorsResult {
  doctors: DoctorSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface ListDoctorsApiResponse {
  status: "success";
  data: {
    users: DoctorSummary[];
    total: number;
    page: number;
    limit: number;
  };
}

/* ------------------------------------------------------------------ */
/* Doctor stats                                                         */
/* ------------------------------------------------------------------ */

export interface DoctorStats {
  completedSessions: number;
  totalBeneficiaries: number;
  averageRating: number;
  totalRatings: number;
  ratingLabel: string; // e.g. "4.8 من 5 عبر 96 تقييم"
}

/* ------------------------------------------------------------------ */
/* Upcoming sessions                                                    */
/* ------------------------------------------------------------------ */

/** A doctor's nearest upcoming (ACCEPTED) sessions — booking + slot + patient info. */
export type UpcomingSession = BookingWithSlotAndUser;