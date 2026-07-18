export type TaskFrequency = "TODAY" | "EVERY_DAY";

export interface Task {
  id: string;
  title: string;
  frequency: TaskFrequency;
  createdAt: string;
  updatedAt: string;
  userId: string;
  /** Derived client-side from today's history — not part of the raw API payload. */
  completed?: boolean;
}

export interface CreateTaskPayload {
  title: string;
  frequency: TaskFrequency;
}

export interface UpdateTaskPayload {
  title?: string;
  frequency?: TaskFrequency;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** One task's completion record as it appears inside a history day. */
export interface TaskHistoryTaskEntry {
  id: string;
  title: string;
  frequency: TaskFrequency;
  completedAt: string;
  completedTitle: string;
  completedFrequency: TaskFrequency;
}

/** A single day returned by /task/history and /task/history/:date */
export interface TaskHistoryDay {
  date: string;
  totalTasks: number;
  tasks: TaskHistoryTaskEntry[];
}

export interface TaskHistoryPage {
  data: TaskHistoryDay[];
  pagination: Pagination;
}

/** One row returned by /task/:id/history */
export interface TaskCompletionRecord {
  id: string;
  userId: string;
  taskId: string;
  date: string;
  completedAt: string;
  taskTitle: string;
  taskFrequency: TaskFrequency;
}

// ...existing exports (Task, TaskFrequency, CreateTaskPayload, UpdateTaskPayload)...

export interface TaskHistoryEntry {
  id: string;
  title: string;
  frequency: TaskFrequency;
  completedAt: string;
  completedTitle: string;
  completedFrequency: TaskFrequency;
}

export interface TaskHistoryDay {
  date: string;
  totalTasks: number;
  tasks: TaskHistoryEntry[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface TaskHistoryResponse {
  data: TaskHistoryDay[];
  pagination: Pagination;
}