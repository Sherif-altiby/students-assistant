import { api } from "@/lib/api";
import type {
  ItemResponse,
  ListResponse,
  CreateAvailabilityRulePayload,
  UpdateAvailabilityRulePayload,
  AvailabilityRule,
  Slot,
  Booking,
  BookingWithSlot,
  BookingWithSlotAndUser,
  ListDoctorsParams,
  ListDoctorsResult,
  ListDoctorsApiResponse,
  DoctorStats,
  UpcomingSession,
} from "@/types/support";

export type {
  AvailabilityRuleType,
  DayOfWeek,
  CreateAvailabilityRulePayload,
  UpdateAvailabilityRulePayload,
  AvailabilityRule,
  SlotStatus,
  Slot,
  BookingStatus,
  Booking,
  BookingUser,
  BookingWithSlot,
  BookingWithSlotAndUser,
  DoctorSummary,
  ListDoctorsParams,
  ListDoctorsResult,
  DoctorStats,
  UpcomingSession,
} from "@/types/support";

/* ------------------------------------------------------------------ */
/* Availability rules                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Doctor stats                                                         */
/* ------------------------------------------------------------------ */

export async function getDoctorStats(): Promise<DoctorStats> {
  const res = await api.get<ItemResponse<DoctorStats>>("/support/doctor/stats");
  return res.data.data;
}

/* ------------------------------------------------------------------ */
/* Upcoming sessions                                                    */
/* ------------------------------------------------------------------ */

export async function getUpcomingSessions(): Promise<UpcomingSession[]> {
  const res = await api.get<ListResponse<UpcomingSession>>(
    "/support/doctor/upcoming",
  );
  return res.data.data;
}