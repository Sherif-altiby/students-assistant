import type { GenerateScheduleInput } from './study-table.schema';

export interface GeneratorLesson {
  id: string;
  title: string;
  order: number;
}

export interface GeneratorUnit {
  id: string;
  title: string;
  order: number;
  lessons: GeneratorLesson[];
}

export interface GeneratorSubject {
  id: string;
  title: string;
  units: GeneratorUnit[];
}

export interface PlannedSession {
  subjectId: string;
  lessonId: string;
  date: string;
  order: number;
  isReview?: boolean;
}

export interface GeneratorInput {
  startDate: string;
  endDate: string;
  subjects: GeneratorSubject[];
  completedLessonIds: Set<string>;
  schedule: GenerateScheduleInput;
  fillAllDays?: boolean;
}

export interface GeneratorSuggestion {
  code:
    | 'INCREASE_DAILY_CAPACITY'
    | 'ADD_STUDY_DAYS'
    | 'EXTEND_DATE_RANGE'
    | 'NO_LESSONS'
    | 'ALL_LESSONS_COMPLETED';
  message: string;
}

export interface GeneratorResult {
  sessions: PlannedSession[];
  totalLessons: number;
  scheduledCount: number;
  reviewCount: number;
  skippedCompletedCount: number;
  eligibleDaysCount: number;
  selectedSubjectsCount: number;
  unscheduledLessonsCount: number;
  capacity: number;
  suggestions: GeneratorSuggestion[];
}

export interface PlannedDay<TSession = PlannedSession> {
  date: string;
  sessions: TSession[];
}

export interface PlannedWeek<TSession = PlannedSession> {
  week: number;
  startDate: string;
  endDate: string;
  days: PlannedDay<TSession>[];
}

export interface PlannedMonth<TSession = PlannedSession> {
  month: number;
  year: number;
  monthName: string;
  weeks: PlannedWeek<TSession>[];
}

export interface StudyTableProgress {
  total: number;
  completed: number;
  upcoming: number;
  inProgress: number;
  late: number;
  percent: number;
  byStatus: {
    COMPLETED: number;
    UPCOMING: number;
    IN_PROGRESS: number;
    LATE: number;
  };
  asOfDate: string;
  subjects: Array<{
    subjectId: string;
    subjectTitle: string;
    total: number;
    completed: number;
    upcoming: number;
    inProgress: number;
    late: number;
    percent: number;
    units: Array<{
      unitId: string;
      unitTitle: string;
      total: number;
      completed: number;
      upcoming: number;
      inProgress: number;
      late: number;
      percent: number;
    }>;
  }>;
}
