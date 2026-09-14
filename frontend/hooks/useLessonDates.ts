"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLessonDate,
  deleteLessonDate,
  downloadLessonDatesPdf,
  listLessonDates,
  updateLessonDate,
} from "@/lib/lesson-dates";
import type {
  CreateLessonDatePayload,
  LessonDate,
  UpdateLessonDatePayload,
} from "@/types/lesson-date";

const LESSON_DATES_KEY = ["lesson-dates"] as const;

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  return anyErr?.response?.data?.message || anyErr?.message || fallback;
}

export function useLessonDates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LESSON_DATES_KEY,
    queryFn: listLessonDates,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: LESSON_DATES_KEY });

  const createMutation = useMutation({
    mutationFn: (payload: CreateLessonDatePayload) => createLessonDate(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<LessonDate[]>(LESSON_DATES_KEY, (old) => [
        ...(old ?? []),
        created,
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateLessonDatePayload;
    }) => updateLessonDate(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<LessonDate[]>(LESSON_DATES_KEY, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLessonDate(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LESSON_DATES_KEY });
      const previous = queryClient.getQueryData<LessonDate[]>(LESSON_DATES_KEY);
      queryClient.setQueryData<LessonDate[]>(LESSON_DATES_KEY, (old) =>
        old?.filter((item) => item.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LESSON_DATES_KEY, context.previous);
      }
    },
    onSettled: invalidate,
  });

  /** Creates a new lesson, or updates one in place when `editingId` is given. */
  function saveLessonDate(input: CreateLessonDatePayload, editingId?: string | null) {
    return editingId
      ? updateMutation.mutateAsync({ id: editingId, payload: input })
      : createMutation.mutateAsync(input);
  }

  const loadError = query.isError
    ? extractErrorMessage(query.error, "تعذر تحميل المواعيد.")
    : null;

  return {
    lessonDates: query.data ?? [],
    isLoading: query.isLoading,
    loadError,

    saveLessonDate,
    isSaving: createMutation.isPending || updateMutation.isPending,
    /** Throws with a server-provided message (e.g. conflict details) on failure — catch in the caller. */
    extractErrorMessage,

    deleteLessonDate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deletingId: deleteMutation.isPending ? (deleteMutation.variables ?? null) : null,

    downloadLessonDatesPdf,
  };
}