"use client";

import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeHabit,
  createHabit,
  deleteHabit,
  getHabitHistory,
  getHabitProgress,
  updateHabit,
} from "@/lib/habits";
import type { HabitProgressPeriod } from "@/lib/habits";

const HISTORY_PAGE_SIZE = 6;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Chart data for the habit progress dashboard, filterable by day/week/month. */
export function useHabitProgress(period: HabitProgressPeriod) {
  const query = useQuery({
    queryKey: ["habits", "progress", period],
    queryFn: () => getHabitProgress(period),
    placeholderData: keepPreviousData,
  });

  return {
    points: query.data?.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}

export function useHabits() {
  const queryClient = useQueryClient();
  const [historyPage, setHistoryPage] = useState(1);
  const todayKey = toDateKey(new Date());

  const todayQuery = useQuery({
    queryKey: ["habit-history", "today"],
    queryFn: () => getHabitHistory({ page: 1, limit: 1 }),
  });

  const historyQuery = useQuery({
    queryKey: ["habit-history", "table", historyPage],
    queryFn: () => getHabitHistory({ page: historyPage, limit: HISTORY_PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const habits = todayQuery.data?.habits ?? [];
  const todayEntry = todayQuery.data?.history.find((h) => h.date === todayKey) ?? {
    date: todayKey,
    completedHabitIds: [] as string[],
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["habit-history"] });

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: completeHabit,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateHabit(id, { title }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: invalidate,
  });

  const error =
    todayQuery.isError || historyQuery.isError
      ? "تعذر تحميل بيانات العادات"
      : createMutation.isError
        ? "تعذر إضافة العادة، حاول مرة أخرى"
        : completeMutation.isError
          ? "تعذر تحديد العادة كمنجزة"
          : updateMutation.isError
            ? "تعذر تحديث اسم العادة"
            : deleteMutation.isError
              ? "تعذر حذف العادة"
              : null;

  return {
    habits,
    todayEntry,
    isLoading: todayQuery.isLoading,
    error,

    createHabit: createMutation.mutate,
    isCreating: createMutation.isPending,

    completeHabit: completeMutation.mutate,
    isCompleting: completeMutation.isPending,

    updateHabitTitle: updateMutation.mutate,

    deleteHabit: deleteMutation.mutate,

    history: historyQuery.data?.history ?? [],
    historyPagination: historyQuery.data?.pagination,
    historyPage,
    setHistoryPage,
    isHistoryFetching: historyQuery.isFetching,
  };
}