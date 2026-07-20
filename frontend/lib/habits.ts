import { api } from "@/lib/api";
import type {
  CreateHabitPayload,
  Habit,
  HabitHistoryResponse,
  ListHabitsResponse,
  UpdateHabitPayload,
} from "@/types";

interface ItemResponse<T> {
  status: "success";
  data: T;
}

export interface GetHabitHistoryParams {
  page?: number;
  limit?: number;
}

export async function listHabits(): Promise<Habit[]> {
  const res = await api.get<ListHabitsResponse>("/habit");
  return res.data.data.habits;
}

export async function getHabitHistory(
  params: GetHabitHistoryParams = {},
): Promise<HabitHistoryResponse["data"]> {
  const res = await api.get<HabitHistoryResponse>("/habit/history", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 6,
    },
  });
  return res.data.data;
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  const res = await api.post<ItemResponse<Habit>>("/habit", payload);
  return res.data.data;
}

export async function updateHabit(
  id: string,
  payload: UpdateHabitPayload,
): Promise<Habit> {
  const res = await api.patch<ItemResponse<Habit>>(`/habit/${id}`, payload);
  return res.data.data;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/habit/${id}`);
}

export async function completeHabit(id: string): Promise<void> {
  await api.post(`/habit/${id}/complete`);
}

export type HabitProgressPeriod = "day" | "week" | "month";

export interface HabitProgressPoint {
  period: string;
  completedCount: number;
}

export interface HabitProgressResponse {
  period: HabitProgressPeriod;
  data: HabitProgressPoint[];
}

interface HabitProgressApiResponse {
  status: "success";
  data: HabitProgressResponse;
}

export async function getHabitProgress(
  period: HabitProgressPeriod = "day",
): Promise<HabitProgressResponse> {
  const res = await api.get<HabitProgressApiResponse>("/habit/progress", {
    params: { period },
  });
  return res.data.data;
}


export interface HabitStats {
  habits: { id: string; title: string }[];
  total: number;
  completed: number;
  notCompleted: number;
  completionRate: number;
  longestStreak: number;
}

interface HabitStatsApiResponse {
  status: "success";
  data: HabitStats;
}

export async function getHabitStats(): Promise<HabitStats> {
  const res = await api.get<HabitStatsApiResponse>("/habit/stats");
  return res.data.data;
}