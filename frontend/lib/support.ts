import { api } from "@/lib/api";

interface ItemResponse<T> {
  status: "success";
  data: T;
}

interface ListResponse<T> {
  status: "success";
  data: T[];
}

/* ------------------------------------------------------------------ */
/* Availability rules                                                  */
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

export async function listAvailabilityRules(): Promise<AvailabilityRule[]> {
  const res = await api.get<ListResponse<AvailabilityRule>>(
    "/support/doctors/me/availability-rules",
  );
  return res.data.data;
}

export async function createAvailabilityRule(
  payload: CreateAvailabilityRulePayload,
): Promise<AvailabilityRule> {
  const res = await api.post<ItemResponse<AvailabilityRule>>(
    "/support/doctors/me/availability-rules",
    payload,
  );
  return res.data.data;
}

export async function updateAvailabilityRule(
  id: string,
  payload: UpdateAvailabilityRulePayload,
): Promise<AvailabilityRule> {
  const res = await api.patch<ItemResponse<AvailabilityRule>>(
    `/support/doctors/me/availability-rules/${id}`,
    payload,
  );
  return res.data.data;
}

export async function deleteAvailabilityRule(id: string): Promise<void> {
  await api.delete(`/support/doctors/me/availability-rules/${id}`);
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

/** Fetches all available slots for a doctor (endpoint is POST, no body needed). */
export async function getDoctorSlots(doctorId: string): Promise<Slot[]> {
  const res = await api.get<ListResponse<Slot>>(
    `/support/doctors/${doctorId}/slots`,
  );
  return res.data.data;
}

export async function setSlotMeetingLink(
  slotId: string,
  meetingLink: string,
): Promise<Slot> {
  const res = await api.patch<ItemResponse<Slot>>(
    `/support/slots/${slotId}/meeting-link`,
    { meetingLink },
  );
  return res.data.data;
}

export async function completeSlot(slotId: string): Promise<Slot> {
  const res = await api.post<ItemResponse<Slot>>(
    `/support/slots/${slotId}/complete`,
  );
  return res.data.data;
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

export async function bookSlot(slotId: string): Promise<Booking> {
  const res = await api.post<ItemResponse<Booking>>(
    `/support/slots/${slotId}/bookings`,
  );
  return res.data.data;
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  const res = await api.post<ItemResponse<Booking>>(
    `/support/bookings/${bookingId}/cancel`,
  );
  return res.data.data;
}

export async function getUserBookings(): Promise<BookingWithSlot[]> {
  const res = await api.get<ListResponse<BookingWithSlot>>(
    "/support/users/me/bookings",
  );
  return res.data.data;
}

export async function getDoctorBookings(): Promise<BookingWithSlotAndUser[]> {
  const res = await api.get<ListResponse<BookingWithSlotAndUser>>(
    "/support/doctors/me/bookings",
  );
  return res.data.data;
}

export async function respondToBooking(
  bookingId: string,
  accept: boolean,
): Promise<Booking> {
  const res = await api.post<ItemResponse<Booking>>(
    `/support/bookings/${bookingId}/respond`,
    { accept },
  );
  return res.data.data;
}

export async function rateBooking(
  bookingId: string,
  score: number,
): Promise<Booking> {
  const res = await api.post<ItemResponse<Booking>>(
    `/support/bookings/${bookingId}/rating`,
    { score },
  );
  return res.data.data;
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

interface ListDoctorsApiResponse {
  status: "success";
  data: {
    users: DoctorSummary[];
    total: number;
    page: number;
    limit: number;
  };
}

export async function listDoctors(
  params: ListDoctorsParams = {},
): Promise<ListDoctorsResult> {
  const res = await api.get<ListDoctorsApiResponse>("/users/doctors", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  });
  const { users, total, page, limit } = res.data.data;
  return { doctors: users, total, page, limit };
}