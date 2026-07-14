import { api } from "@/lib/api";
import type { CreateTaskPayload, Task, UpdateTaskPayload } from "@/types";

interface ListResponse<T> { status: "success"; data: T[] }
interface ItemResponse<T> { status: "success"; data: T }

export async function listTasks(): Promise<Task[]> {
  const res = await api.get<ListResponse<Task>>("/task");
  return res.data.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await api.post<ItemResponse<Task>>("/task", payload);
  return res.data.data;
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  const res = await api.patch<ItemResponse<Task>>(`/task/${id}`, payload);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/task/${id}`);
}
