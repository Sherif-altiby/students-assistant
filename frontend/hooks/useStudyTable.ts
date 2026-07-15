"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeLesson,
  createDaySubjects,
  getStudyTable,
  updateDaySubjects,
  updateStudyTable,
} from "@/lib/study-table";
import type { UpdateDaySubjectsPayload } from "@/types/study-table";

export function useStudyTable(tableId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["study-table", tableId],
    queryFn: () => getStudyTable(tableId),
    enabled: !!tableId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["study-table", tableId] });

  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateStudyTable(tableId, { title }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["study-tables"] });
    },
  });

  const completeLessonMutation = useMutation({
    mutationFn: completeLesson,
    onSuccess: invalidate,
  });

  const createDaySubjectsMutation = useMutation({
    mutationFn: ({ dayId, payload }: { dayId: string; payload: UpdateDaySubjectsPayload }) =>
      createDaySubjects(dayId, payload),
    onSuccess: invalidate,
  });

  const updateDaySubjectsMutation = useMutation({
    mutationFn: ({ dayId, payload }: { dayId: string; payload: UpdateDaySubjectsPayload }) =>
      updateDaySubjects(dayId, payload),
    onSuccess: invalidate,
  });

  return {
    table: query.data,
    isLoading: query.isLoading,

    updateTitle: updateTitleMutation.mutate,
    isUpdatingTitle: updateTitleMutation.isPending,

    toggleLessonComplete: completeLessonMutation.mutate,
    isCompletingLesson: completeLessonMutation.isPending,

    saveDaySubjects: (
      dayId: string,
      payload: UpdateDaySubjectsPayload,
      hasExistingSubjects: boolean,
    ) => {
      const mutation = hasExistingSubjects ? updateDaySubjectsMutation : createDaySubjectsMutation;
      mutation.mutate({ dayId, payload });
    },
    isSavingDaySubjects:
      createDaySubjectsMutation.isPending || updateDaySubjectsMutation.isPending,
  };
}