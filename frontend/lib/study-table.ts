import { api } from "@/lib/api";
import type {
  GenerateStudyTableInput,
  AvailableStudyMonthsResponse,
  StudyTableGenerationResult,
  ListStudyTablesResponse,
  NotificationListResponse,
  NotificationItem,
  StudySession,
  StudySubjectSummary,
  CreateStudySubjectInput,
  StudySessionInput,
  StudySessionReplacement,
  StudySubjectDetails,
  StudyTableDetail,
  StudyTableInput,
  StudyTableProgress,
  StudyTableSummary,
  StudyTableUpdateInput,
  UpdateStudySessionInput,
} from "@/types/study-table";

interface ApiEnvelope<T> {
  status: "success";
  data: T;
  warning?: string;
}

export interface ListStudyTablesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listAvailableStudyMonths(
  count = 12,
): Promise<AvailableStudyMonthsResponse> {
  const response = await api.get<ApiEnvelope<AvailableStudyMonthsResponse>>(
    "/study-table/available-months",
    { params: { count } },
  );
  return response.data.data;
}

export async function listStudyTables(
  params: ListStudyTablesParams = {},
): Promise<ListStudyTablesResponse> {
  const response = await api.get<ApiEnvelope<ListStudyTablesResponse>>(
    "/study-table",
    { params },
  );
  return response.data.data;
}

export async function getStudyTable(id: string): Promise<StudyTableDetail> {
  const response = await api.get<ApiEnvelope<StudyTableDetail>>(
    `/study-table/${id}`,
  );
  return response.data.data;
}

export async function createStudyTable(
  payload: StudyTableInput,
): Promise<StudyTableSummary> {
  const response = await api.post<ApiEnvelope<StudyTableSummary>>(
    "/study-table",
    payload,
  );
  return response.data.data;
}

export async function generateStudyTable(
  payload: GenerateStudyTableInput,
  preview = false,
): Promise<StudyTableGenerationResult> {
  const response = await api.post<ApiEnvelope<StudyTableGenerationResult>>(
    "/study-table/generate",
    payload,
    { params: preview ? { preview: "true" } : undefined },
  );
  return response.data.data;
}

export async function updateStudyTable(
  id: string,
  payload: StudyTableUpdateInput,
): Promise<StudyTableSummary> {
  const response = await api.patch<ApiEnvelope<StudyTableSummary>>(
    `/study-table/${id}`,
    payload,
  );
  return response.data.data;
}

export async function deleteStudyTable(id: string): Promise<void> {
  await api.delete(`/study-table/${id}`);
}

export async function getStudyTableProgress(
  id: string,
): Promise<StudyTableProgress> {
  const response = await api.get<ApiEnvelope<StudyTableProgress>>(
    `/study-table/${id}/progress`,
  );
  return response.data.data;
}

export async function createStudySession(
  tableId: string,
  payload: StudySessionInput,
): Promise<StudySession> {
  const response = await api.post<ApiEnvelope<StudySession>>(
    `/study-table/${tableId}/sessions`,
    payload,
  );
  return response.data.data;
}

export async function updateStudySession(
  sessionId: string,
  payload: UpdateStudySessionInput,
): Promise<StudySession> {
  const response = await api.patch<ApiEnvelope<StudySession>>(
    `/study-table/sessions/${sessionId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteStudySession(sessionId: string): Promise<void> {
  await api.delete(`/study-table/sessions/${sessionId}`);
}

export async function setStudySessionCompleted(
  sessionId: string,
  completed: boolean,
): Promise<StudySession> {
  const method = completed ? "post" : "delete";
  const response = await api[method]<ApiEnvelope<StudySession>>(
    `/study-table/sessions/${sessionId}/complete`,
  );
  return response.data.data;
}

export async function replaceDaySessions(
  dayId: string,
  sessions: StudySessionReplacement[],
): Promise<StudySession[]> {
  const response = await api.put<ApiEnvelope<StudySession[]>>(
    `/study-table/days/${dayId}/sessions`,
    { sessions },
  );
  return response.data.data;
}

export async function downloadStudyTablePdf(id: string): Promise<Blob> {
  const response = await api.get(`/study-table/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
}

export async function listStudySubjects(): Promise<StudySubjectSummary[]> {
  return listStudySubjectsPage({ page: 1, limit: 100 });
}

export async function listStudySubjectsPage(
  params: { page?: number; limit?: number },
): Promise<StudySubjectSummary[]> {
  const response = await api.get<
    ApiEnvelope<{ data: StudySubjectSummary[] }>
  >("/subjects", { params });
  return response.data.data.data;
}

export async function createStudySubject(
  payload: CreateStudySubjectInput,
): Promise<StudySubjectDetails> {
  const response = await api.post<ApiEnvelope<StudySubjectDetails>>(
    "/subjects",
    payload,
  );
  return response.data.data;
}

export async function listNotifications(
  page = 1,
  limit = 20,
): Promise<NotificationListResponse> {
  const response = await api.get<ApiEnvelope<NotificationListResponse>>(
    "/notifications",
    { params: { page, limit } },
  );
  return response.data.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await api.get<ApiEnvelope<{ unreadCount: number }>>(
    "/notifications/unread-count",
  );
  return response.data.data.unreadCount;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const response = await api.patch<ApiEnvelope<NotificationItem>>(
    `/notifications/${id}/read`,
  );
  return response.data.data;
}

export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function markAllNotificationsRead(): Promise<{ updatedCount: number }> {
  const response = await api.post<ApiEnvelope<{ updatedCount: number }>>(
    "/notifications/read-all",
  );
  return response.data.data;
}

export async function getStudySubject(
  id: string,
): Promise<StudySubjectDetails> {
  const response = await api.get<ApiEnvelope<StudySubjectDetails>>(
    `/subjects/${id}`,
  );
  return response.data.data;
}
