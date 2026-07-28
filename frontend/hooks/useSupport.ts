"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  bookSlot,
  cancelBooking,
  completeSlot,
  createAvailabilityRule,
  deleteAvailabilityRule,
  getDoctorBookings,
  getDoctorSlots,
  getDoctorStats,
  getUpcomingSessions,
  getUserBookings,
  listAvailabilityRules,
  listDoctors,
  rateBooking,
  respondToBooking,
  setSlotMeetingLink,
  updateAvailabilityRule,
} from "@/lib/support";
import type {
  CreateAvailabilityRulePayload,
  ListDoctorsParams,
  UpdateAvailabilityRulePayload,
} from "@/lib/support";

/* ------------------------------------------------------------------ */
/* Doctor: availability rules                                          */
/* ------------------------------------------------------------------ */

export function useAvailabilityRules() {
  const queryClient = useQueryClient();

  const rulesQuery = useQuery({
    queryKey: ["support", "availability-rules"],
    queryFn: listAvailabilityRules,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["support", "availability-rules"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateAvailabilityRulePayload) => createAvailabilityRule(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAvailabilityRulePayload }) =>
      updateAvailabilityRule(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: invalidate,
  });

  const error =
    rulesQuery.isError
      ? "تعذر تحميل قواعد الإتاحة"
      : createMutation.isError
        ? "تعذر إضافة القاعدة، حاول مرة أخرى"
        : updateMutation.isError
          ? "تعذر تحديث القاعدة"
          : deleteMutation.isError
            ? "تعذر حذف القاعدة"
            : null;

  return {
    rules: rulesQuery.data ?? [],
    isLoading: rulesQuery.isLoading,
    isFetching: rulesQuery.isFetching,
    error,

    createRule: createMutation.mutate,
    isCreating: createMutation.isPending,

    updateRule: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteRule: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

/* ------------------------------------------------------------------ */
/* User: browsing & booking slots                                       */
/* ------------------------------------------------------------------ */

/** Available slots for a given doctor, plus a mutation to book one. */
export function useDoctorSlots(doctorId: string | undefined) {
  const queryClient = useQueryClient();

  const slotsQuery = useQuery({
    queryKey: ["support", "slots", doctorId],
    queryFn: () => getDoctorSlots(doctorId as string),
    enabled: Boolean(doctorId),
  });

  const bookMutation = useMutation({
    mutationFn: bookSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "slots", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["support", "user-bookings"] });
    },
  });

  return {
    slots: slotsQuery.data ?? [],
    isLoading: slotsQuery.isLoading,
    isFetching: slotsQuery.isFetching,
    isError: slotsQuery.isError,
    refetch: slotsQuery.refetch,

    bookSlot: bookMutation.mutate,
    isBooking: bookMutation.isPending,
    isBookingError: bookMutation.isError,
  };
}

export function useUserBookings() {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["support", "user-bookings"],
    queryFn: getUserBookings,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["support", "user-bookings"] });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: invalidate,
  });

  const rateMutation = useMutation({
    mutationFn: ({ bookingId, score }: { bookingId: string; score: number }) =>
      rateBooking(bookingId, score),
    onSuccess: invalidate,
  });

  const error =
    bookingsQuery.isError
      ? "تعذر تحميل الحجوزات"
      : cancelMutation.isError
        ? "تعذر إلغاء الحجز"
        : rateMutation.isError
          ? "تعذر تقييم الحجز"
          : null;

  return {
    bookings: bookingsQuery.data ?? [],
    isLoading: bookingsQuery.isLoading,
    isFetching: bookingsQuery.isFetching,
    error,

    cancelBooking: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,

    rateBooking: rateMutation.mutate,
    isRating: rateMutation.isPending,
  };
}

/* ------------------------------------------------------------------ */
/* Doctor: managing incoming bookings                                   */
/* ------------------------------------------------------------------ */

export function useDoctorBookings() {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["support", "doctor-bookings"],
    queryFn: getDoctorBookings,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["support", "doctor-bookings"] });

  const respondMutation = useMutation({
    mutationFn: ({ bookingId, accept }: { bookingId: string; accept: boolean }) =>
      respondToBooking(bookingId, accept),
    onSuccess: invalidate,
  });

  const meetingLinkMutation = useMutation({
    mutationFn: ({ slotId, meetingLink }: { slotId: string; meetingLink: string }) =>
      setSlotMeetingLink(slotId, meetingLink),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: completeSlot,
    onSuccess: invalidate,
  });

  const error =
    bookingsQuery.isError
      ? "تعذر تحميل حجوزات الطبيب"
      : respondMutation.isError
        ? "تعذر الرد على الحجز"
        : meetingLinkMutation.isError
          ? "تعذر إضافة رابط الاجتماع"
          : completeMutation.isError
            ? "تعذر إتمام الجلسة"
            : null;

  return {
    bookings: bookingsQuery.data ?? [],
    isLoading: bookingsQuery.isLoading,
    isFetching: bookingsQuery.isFetching,
    error,

    respondToBooking: respondMutation.mutate,
    isResponding: respondMutation.isPending,

    setMeetingLink: meetingLinkMutation.mutate,
    isSettingMeetingLink: meetingLinkMutation.isPending,

    completeSlot: completeMutation.mutate,
    isCompletingSlot: completeMutation.isPending,
  };
}

/* ------------------------------------------------------------------ */
/* Doctor: profile stats (completed sessions, beneficiaries, rating)   */
/* ------------------------------------------------------------------ */

export function useDoctorStats() {
  const query = useQuery({
    queryKey: ["support", "doctor-stats"],
    queryFn: getDoctorStats,
  });

  const error = query.isError ? "تعذر تحميل إحصائيات الطبيب" : null;

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
  };
}

/* ------------------------------------------------------------------ */
/* Doctor: nearest upcoming sessions (max 3)                            */
/* ------------------------------------------------------------------ */

export function useUpcomingSessions() {
  const query = useQuery({
    queryKey: ["support", "upcoming-sessions"],
    queryFn: getUpcomingSessions,
  });

  const error = query.isError ? "تعذر تحميل الجلسات القادمة" : null;

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error,
  };
}

/* ------------------------------------------------------------------ */
/* User: doctors directory                                             */
/* ------------------------------------------------------------------ */

export function useDoctors(params: ListDoctorsParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const query = useQuery({
    queryKey: ["support", "doctors", page, limit],
    queryFn: () => listDoctors({ page, limit }),
    placeholderData: keepPreviousData,
  });

  return {
    doctors: query.data?.doctors ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? page,
    limit: query.data?.limit ?? limit,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}