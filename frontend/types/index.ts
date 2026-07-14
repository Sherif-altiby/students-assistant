export type Gender = "MALE" | "FEMALE";
export type Level = "AZHARI_SECONDARY" | "GENERAL_SECONDARY";
export type Track = "SCIENCE" | "LITERATURE" | "MATH";

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

export type TaskFrequency = "TODAY" | "EVERY_DAY";

export interface Task {
  id: string;
  title: string;
  frequency: TaskFrequency;
  completed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  frequency: TaskFrequency;
}

export interface UpdateTaskPayload {
  title?: string;
  frequency?: TaskFrequency;
  completed?: boolean;
}

/**
 * NOTE: the /habit endpoints were not provided by the backend spec.
 * They are implemented here mirroring the /task contract
 * (POST /habit, PATCH /habit/:id, GET /habit, DELETE /habit/:id).
 * Adjust lib/habits.ts if the real contract differs.
 */
export type HabitFrequency = "DAILY" | "WEEKLY";

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  streak?: number;
  completedToday?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListHabitsResponse {
  status: "success";
  data: { habits: Habit[] };
}

export interface CreateHabitPayload {
  title: string;
  frequency: HabitFrequency;
}

export interface UpdateHabitPayload {
  title?: string;
  frequency?: HabitFrequency;
  completedToday?: boolean;
}

/**
 * NOTE: /support (الدعم النفسي) and /consultation (الاستشارات) endpoints
 * were not provided either. Modeled as simple booking records so the
 * monthly quota (1 support / month, 3 consultations / month) can be
 * enforced in the UI from the `createdAt` dates returned by the API.
 */
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
