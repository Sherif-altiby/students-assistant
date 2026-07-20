export type Gender = "MALE" | "FEMALE";
export type Level = "AZHARI_SECONDARY" | "GENERAL_SECONDARY";
export type Track = "SCIENCE" | "LITERATURE" | "SCIENCE_MATH" | "SCIENCE_SCIENCE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: Gender;
  level: Level;
  track: Track;
  parentPhone: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  status: "success";
  data: { user: User; accessToken: string };
}

export interface RefreshResponse {
  status: "success";
  data: { accessToken: string };
}

export interface MeResponse {
  status: "success";
  data: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: Gender;
  level: Level;
  track: Track;
  parentPhone: string;
  country: string;
}

export type HabitFrequency = "DAILY" | "WEEKLY";

export interface Habit {
  id: string;
  title: string;
}

export interface HabitHistoryEntry {
  date: string; // "YYYY-MM-DD"
  completedHabitIds: string[];
}

export interface ListHabitsResponse {
  status: "success";
  data: { habits: Habit[] };
}

export interface ListHabitsResponse {
  status: "success";
  data: {
    habits: Habit[];
  };
}

export interface CreateHabitPayload {
  title: string;
}

export interface UpdateHabitPayload {
  title: string;
}

export interface HabitPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface HabitHistoryResponse {
  status: "success";
  data: {
    habits: Habit[];
    history: HabitHistoryEntry[];
    pagination: HabitPaginationMeta;
  };
}

export interface SupportSession {
  id: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  note?: string;
  createdAt: string;
}

export interface ConsultationSession {
  id: string;
  status: "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  subject?: string;
  createdAt: string;
}
