"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createStudySession,
  deleteStudyTable,
  deleteStudySession,
  downloadStudyTablePdf,
  getStudyTable,
  getStudyTableProgress,
  replaceDaySessions,
  setStudySessionCompleted,
  updateStudySession,
  updateStudyTable,
} from "@/lib/study-table";
import type {
  StudySession,
  StudySessionInput,
  StudySessionReplacement,
  UpdateStudySessionInput,
} from "@/types/study-table";

export function useStudyTable(tableId: string) {
  const queryClient = useQueryClient();
  const tableKey = ["study-table", tableId] as const;
  const progressKey = ["study-table-progress", tableId] as const;
  const query = useQuery({
    queryKey: tableKey,
    queryFn: () => getStudyTable(tableId),
    enabled: Boolean(tableId),
  });
  const progressQuery = useQuery({
    queryKey: progressKey,
    queryFn: () => getStudyTableProgress(tableId),
    enabled: Boolean(tableId),
  });
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tableKey }),
      queryClient.invalidateQueries({ queryKey: progressKey }),
      queryClient.invalidateQueries({ queryKey: ["study-tables"] }),
    ]);
  };
  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => updateStudyTable(tableId, { title }),
    onSuccess: async () => {
      await invalidate();
      toast.success("تم تحديث عنوان الجدول");
    },
    onError: () => toast.error("تعذر تحديث الجدول"),
  });
  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      setStudySessionCompleted(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: tableKey });
      const previous = queryClient.getQueryData<typeof query.data>(tableKey);
      queryClient.setQueryData<typeof query.data>(tableKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          days: current.days.map((day) => ({
            ...day,
            sessions: day.sessions.map((session) => session.id === id
              ? {
                ...session,
                completedAt: completed ? new Date().toISOString() : null,
                lateNotifiedAt: completed ? session.lateNotifiedAt : null,
              }
              : session),
          })),
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(tableKey, context.previous);
      toast.error("تعذر تحديث حالة الجلسة");
    },
    onSettled: invalidate,
  });
  const createSessionMutation = useMutation({
    mutationFn: (payload: StudySessionInput) => createStudySession(tableId, payload),
    onSuccess: invalidate,
    onError: () => toast.error("تعذر إضافة الجلسة"),
  });
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudySessionInput }) =>
      updateStudySession(id, payload),
    onSuccess: invalidate,
    onError: () => toast.error("تعذر تعديل الجلسة"),
  });
  const deleteSessionMutation = useMutation({
    mutationFn: deleteStudySession,
    onSuccess: invalidate,
    onError: () => toast.error("تعذر حذف الجلسة"),
  });
  const replaceDayMutation = useMutation({
    mutationFn: ({ dayId, sessions }: { dayId: string; sessions: StudySessionReplacement[] }) =>
      replaceDaySessions(dayId, sessions),
    onSuccess: invalidate,
    onError: () => toast.error("تعذر استبدال جلسات اليوم"),
  });
  const downloadMutation = useMutation({
    mutationFn: () => downloadStudyTablePdf(tableId),
    onError: () => toast.error("تعذر تحميل ملف الجدول"),
  });
  const deleteTableMutation = useMutation({
    mutationFn: deleteStudyTable,
    onSuccess: invalidate,
    onError: () => toast.error("تعذر حذف الجدول"),
  });

  return {
    table: query.data,
    progress: progressQuery.data,
    isLoading: query.isLoading,
    isLoadingProgress: progressQuery.isLoading,
    error: query.error,
    progressError: progressQuery.error,
    updateTitle: updateTitleMutation.mutate,
    isUpdatingTitle: updateTitleMutation.isPending,
    toggleSessionComplete: (id: string, completed: boolean) => completeMutation.mutate({ id, completed }),
    isCompletingSession: completeMutation.isPending,
    createSession: createSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    replaceDaySessions: replaceDayMutation.mutateAsync,
    isReplacingDaySessions: replaceDayMutation.isPending,
    downloadPdf: downloadMutation.mutateAsync,
    isDownloadingPdf: downloadMutation.isPending,
    deleteTable: deleteTableMutation.mutateAsync,
    isDeletingTable: deleteTableMutation.isPending,
  };
}
