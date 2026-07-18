import { api } from "@/lib/api";
import type {
  CreateTaskPayload,
  Task,
  TaskCompletionRecord,
  TaskHistoryDay,
  TaskHistoryPage,
  TaskHistoryResponse,
  UpdateTaskPayload,
} from "@/types/task";

interface ListResponse<T> {
  status: "success";
  data: T[];
}

interface ItemResponse<T> {
  status: "success";
  data: T;
}

interface HistoryPageResponse {
  status: "success";
  data: TaskHistoryPage;
}

interface HistoryDayResponse {
  status: "success";
  data: TaskHistoryDay;
}

export async function listTasks(): Promise<Task[]> {
  const res = await api.get<ListResponse<Task>>("/task");
  return res.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await api.post<ItemResponse<Task>>("/task", payload);
  return res.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await api.put<ItemResponse<Task>>(`/task/${id}`, payload);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/task/${id}`);
}

export async function completeTask(id: string): Promise<void> {
  await api.post(`/task/${id}/complete`);
}

export async function getTaskHistory(params: {
  page?: number;
  limit?: number;
}): Promise<TaskHistoryPage> {
  const res = await api.get<HistoryPageResponse>("/task/history", { params });
  return res.data.data;
}

/**
 * The endpoint 404s (or returns nothing meaningful) for a day with no
 * completions yet — that's a normal "no history" case, not a real error,
 * so it resolves to `null` instead of throwing.
 */
export async function getTaskHistoryByDate(dateKey: string): Promise<TaskHistoryDay | null> {
  try {
    const res = await api.get<HistoryDayResponse>(`/task/history/${dateKey}`);
    return res.data.data;
  } catch {
    return null;
  }
}

export async function getTaskHistoryByTaskId(taskId: string): Promise<TaskCompletionRecord[]> {
  const res = await api.get<ListResponse<TaskCompletionRecord>>(`/task/${taskId}/history`);
  return res.data.data;
}

export async function listTaskHistory(params: {
  page?: number;
  limit?: number;
} = {}): Promise<TaskHistoryResponse> {
  const { page = 1, limit = 10 } = params;
  const res = await api.get(`/task/history`, { params: { page, limit } });
  // sample response is { status: "success", data: { data: [...], pagination: {...} } }
  return res.data.data;
}

// ---- Progress (chart) ----

export type TaskProgressPeriod = "day" | "week" | "month";

export interface TaskProgressPoint {
  period: string;
  everyDayCompleted: number;
  todayCompleted: number;
}

export interface TaskProgressResponse {
  period: TaskProgressPeriod;
  data: TaskProgressPoint[];
}

interface ProgressApiResponse {
  status: "success";
  data: TaskProgressResponse;
}

export async function getTaskProgress(
  period: TaskProgressPeriod = "day",
): Promise<TaskProgressResponse> {
  const res = await api.get<ProgressApiResponse>("/task/progress", { params: { period } });
  return res.data.data;
}