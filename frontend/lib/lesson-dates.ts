// lib/lesson-dates.ts

import { api } from "@/lib/api";
import type {
  CreateLessonDatePayload,
  LessonDate,
  UpdateLessonDatePayload,
} from "@/types/lesson-date";

interface ListResponse<T> {
  status: "success";
  data: T[];
}

interface ItemResponse<T> {
  status: "success";
  data: T;
}

export async function listLessonDates(): Promise<LessonDate[]> {
  const res = await api.get<ListResponse<LessonDate>>("/lesson-dates");
  return res.data.data;
}

export async function createLessonDate(
  payload: CreateLessonDatePayload
): Promise<LessonDate> {
  const res = await api.post<ItemResponse<LessonDate>>("/lesson-dates", payload);
  return res.data.data;
}

export async function updateLessonDate(
  id: string,
  payload: UpdateLessonDatePayload
): Promise<LessonDate> {
  const res = await api.put<ItemResponse<LessonDate>>(`/lesson-dates/${id}`, payload);
  return res.data.data;
}

export async function deleteLessonDate(id: string): Promise<void> {
  await api.delete(`/lesson-dates/${id}`);
}

export async function downloadLessonDatesPdf(): Promise<void> {
  const res = await api.get("/lesson-dates/pdf", { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lesson-dates.pdf";
  link.click();
  window.URL.revokeObjectURL(url);
}