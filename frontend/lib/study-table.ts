// lib/study-table.ts

import { api } from "@/lib/api";
import type {
  CreateStudyTablePayload,
  ListStudyTablesResponse,
  StudyTableCreateResponse,
  StudyTableDayDetailed,
  StudyTableDetail,
  StudyTableSummary,
  UpdateDaySubjectsPayload,
  UpdateStudyTablePayload,
} from "@/types/study-table";

interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface ListStudyTablesParams {
  page?: number;
  limit?: number;
}

export async function listStudyTables(
  params: ListStudyTablesParams = {},
): Promise<ListStudyTablesResponse> {
  const res = await api.get<ApiEnvelope<ListStudyTablesResponse>>("/study-table", {
    params: { page: params.page ?? 1, limit: params.limit ?? 10 },
  });
  return res.data.data;
}

export async function getStudyTable(id: string): Promise<StudyTableDetail> {
  const res = await api.get<ApiEnvelope<StudyTableDetail>>(`/study-table/${id}`);
  return res.data.data;
}

export async function createStudyTable(
  payload: CreateStudyTablePayload,
): Promise<StudyTableCreateResponse> {
  const res = await api.post<ApiEnvelope<StudyTableCreateResponse>>(
    "/study-table",
    payload,
  );
  return res.data.data;
}

export async function updateStudyTable(
  id: string,
  payload: UpdateStudyTablePayload,
): Promise<StudyTableSummary> {
  const res = await api.patch<ApiEnvelope<StudyTableSummary>>(
    `/study-table/${id}`,
    payload,
  );
  return res.data.data;
}

export async function deleteStudyTable(id: string): Promise<void> {
  await api.delete(`/study-table/${id}`);
}

export async function completeLesson(lessonId: string): Promise<void> {
  await api.post(`/study-table/lessons/${lessonId}/complete`);
}

/** Day has no subjects yet -> POST */
export async function createDaySubjects(
  dayId: string,
  payload: UpdateDaySubjectsPayload,
): Promise<StudyTableDayDetailed> {
  const res = await api.post<ApiEnvelope<StudyTableDayDetailed>>(
    `/study-table/days/${dayId}/subjects`,
    payload,
  );
  return res.data.data;
}

/** Day already has subjects -> PUT (replace) */
export async function updateDaySubjects(
  dayId: string,
  payload: UpdateDaySubjectsPayload,
): Promise<StudyTableDayDetailed> {
  const res = await api.put<ApiEnvelope<StudyTableDayDetailed>>(
    `/study-table/days/${dayId}/subjects`,
    payload,
  );
  return res.data.data;
}

/** Download study table as PDF */
export async function downloadStudyTablePdf(id: string): Promise<Blob> {
  const response = await api.get(`/study-table/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
}