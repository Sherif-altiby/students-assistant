import { api } from "@/lib/api";
import type { CreateHabitPayload, Habit, ListHabitsResponse, UpdateHabitPayload } from "@/types";

interface ItemResponse<T> { status: "success"; data: T }

// NOTE: mirrors the /task contract exactly. Update paths here if the
// backend's real /habit routes differ.
export async function listHabits(): Promise<Habit[]> {
  const res = await api.get<ListHabitsResponse>("/habit");
  return res.data.data.habits;
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  const res = await api.post<ItemResponse<Habit>>("/habit", payload);
  return res.data.data;
}

export async function updateHabit(id: string, payload: UpdateHabitPayload): Promise<Habit> {
  const res = await api.patch<ItemResponse<Habit>>(`/habit/${id}`, payload);
  return res.data.data;
}

export async function deleteHabit(id: string): Promise<void> {
  await api.delete(`/habit/${id}`);
}
