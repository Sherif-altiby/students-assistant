"use client";

import { useMemo } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  completeTask,
  createTask,
  deleteTask,
  getTaskHistoryByDate,
  getTaskProgress,
  listTasks,
  updateTask,
  listTaskHistory,
  getTaskStats,
} from "@/lib/tasks";
import type { CreateTaskPayload, Task, UpdateTaskPayload } from "@/types/task";
import type { TaskProgressPeriod } from "@/lib/tasks";

const TASKS_KEY = ["tasks"] as const;

/** Matches the API's unpadded date-segment format, e.g. "2026-7-17". */
function toHistoryDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function useTaskHistory(page: number, limit = 10) {
  const query = useQuery({
    queryKey: ["tasks", "history", "list", page, limit],
    queryFn: () => listTaskHistory({ page, limit }),
    placeholderData: keepPreviousData,
  });

  return {
    days: query.data?.data ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

/** Chart data for the progress dashboard, filterable by day/week/month. */
export function useTaskProgress(period: TaskProgressPeriod) {
  const query = useQuery({
    queryKey: ["tasks", "progress", period],
    queryFn: () => getTaskProgress(period),
    placeholderData: keepPreviousData,
  });

  return {
    points: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

export function useTasks() {
  const queryClient = useQueryClient();
  const todayKey = toHistoryDateKey(new Date());

  const tasksQuery = useQuery({
    queryKey: TASKS_KEY,
    queryFn: listTasks,
  });

  const todayHistoryQuery = useQuery({
    queryKey: ["tasks", "history", "day", todayKey],
    queryFn: () => getTaskHistoryByDate(todayKey),
    staleTime: 30_000,
  });

  const completedTodayIds = useMemo(
    () => new Set((todayHistoryQuery.data?.tasks ?? []).map((t) => t.id)),
    [todayHistoryQuery.data],
  );

  const tasks: Task[] = useMemo(
    () =>
      (tasksQuery.data ?? []).map((task) => ({
        ...task,
        completed: completedTodayIds.has(task.id),
      })),
    [tasksQuery.data, completedTodayIds],
  );

  const invalidateTasks = () =>
    queryClient.invalidateQueries({ queryKey: TASKS_KEY });
  const invalidateStats = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks", "stats"] });

  const invalidateTodayHistory = () =>
    queryClient.invalidateQueries({ queryKey: ["tasks", "history", "day"] });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: invalidateTasks,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: invalidateTasks,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(TASKS_KEY, context.previous);
    },
    onSettled: () => {
      invalidateTasks();
      invalidateStats();
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => {
      invalidateTasks();
      invalidateTodayHistory();
      invalidateStats();
    },
  });

  const error = tasksQuery.isError
    ? "تعذر تحميل المهام"
    : createMutation.isError
      ? "تعذر إضافة المهمة، حاول مرة أخرى"
      : completeMutation.isError
        ? "تعذر تحديد المهمة كمنجزة"
        : updateMutation.isError
          ? "تعذر تحديث المهمة"
          : deleteMutation.isError
            ? "تعذر حذف المهمة"
            : null;

  return {
    tasks,
    isLoading: tasksQuery.isLoading,
    error,

    createTask: createMutation.mutate,
    isCreating: createMutation.isPending,

    updateFrequency: (id: string, frequency: UpdateTaskPayload["frequency"]) =>
      updateMutation.mutate({ id, payload: { frequency } }),
    updatingTaskId: updateMutation.isPending
      ? (updateMutation.variables?.id ?? null)
      : null,

    deleteTask: deleteMutation.mutate,
    deletingTaskId: deleteMutation.isPending
      ? (deleteMutation.variables ?? null)
      : null,

    completeTask: completeMutation.mutate,
    completingTaskId: completeMutation.isPending
      ? (completeMutation.variables ?? null)
      : null,
  };
}

export function useTaskStats() {
  const query = useQuery({
    queryKey: ["tasks", "stats"],
    queryFn: getTaskStats,
    staleTime: 30_000,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}
