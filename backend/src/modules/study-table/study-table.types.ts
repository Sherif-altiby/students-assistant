import { StudyTableType } from '@prisma/client';

export type Scope = 'ALL' | string[];

export interface StudyTableRangeInput {
  title: string;
  type: 'WEEKLY' | 'CUSTOM' | 'GLOBAL';
  subjects: Scope;
  startDate: string;
  endDate?: string;
}

export interface MonthlyStudyTableInput {
  title: string;
  type: 'MONTHLY';
  subjects: Scope;
  month: number;
  year?: number;
}

export type StudyTableInput = StudyTableRangeInput | MonthlyStudyTableInput;

export interface GenerateScheduleInput {
  studyWeekdays: number[];
  maxSessionsPerDay: number;
}

export type GenerateStudyTableInput = StudyTableInput & {
  schedule: GenerateScheduleInput;
};

export interface SessionInput {
  subjectId: string;
  lessonId: string;
  dayId?: string;
  date?: string;
  order?: number;
}

export interface SessionReplaceInput {
  subjectId: string;
  lessonId: string;
  order?: number;
}

export interface StudyTableUpdateInput {
  title?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  subjects?: Scope;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  month?: number;
  year?: number;
}

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
}

export interface GeneratorInput {
  type: StudyTableType;
  startDate: string;
  endDate: string;
  subjects: GeneratorSubject[];
  completedLessonIds: Set<string>;
  schedule: GenerateScheduleInput;
}

export interface GeneratorSuggestion {
  code: 'INCREASE_DAILY_CAPACITY' | 'ADD_STUDY_DAYS' | 'EXTEND_DATE_RANGE' | 'NO_LESSONS';
  message: string;
}

export interface GeneratorResult {
  sessions: PlannedSession[];
  totalLessons: number;
  selectedSubjectsCount: number;
  unscheduledLessonsCount: number;
  remainingLessonCount: number;
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
