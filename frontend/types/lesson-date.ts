// types/lesson-date.ts

export interface LessonDate {
  id: string;
  subject: string;
  teacher: string;
  dayName: string; // Arabic day name, e.g. "السبت"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  createdAt?: string;
  updatedAt?: string;
}

export interface LessonDateInput {
  subject: string;
  teacher: string;
  dayName: string;
  startTime: string;
  endTime: string;
}

export type CreateLessonDatePayload = LessonDateInput;
export type UpdateLessonDatePayload = Partial<LessonDateInput>;