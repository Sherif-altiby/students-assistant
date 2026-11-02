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

interface LessonDateFields {
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
}

export type CreateLessonDatePayload = LessonDateFields &
  (
    | { dayName: string; dayNames?: never }
    | { dayNames: string[]; dayName?: never }
  );
export type UpdateLessonDatePayload = Partial<LessonDateFields & { dayName: string }>;