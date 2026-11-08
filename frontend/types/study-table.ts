export type StudyTableType = "WEEKLY" | "MONTHLY" | "CUSTOM" | "GLOBAL";
export type StudySessionStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "LATE";
export type SubjectScope = "ALL" | string[];

export interface StudyTableSubject {
  id: string;
  studyTableId: string;
  subjectId: string;
  subject: { id: string; title: string };
}

export interface StudyTableSummary {
  id: string;
  title: string;
  type: StudyTableType;
  startDate: string;
  endDate: string;
  month: number | null;
  year: number | null;
  monthName?: string;
  allSubjects: boolean;
  subjects: StudyTableSubject[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListStudyTablesResponse {
  data: StudyTableSummary[];
  pagination: PaginationMeta;
}

export interface AvailableStudyMonth {
  month: number;
  year: number;
  label: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  remainingDays: number;
}

export interface AvailableStudyMonthsResponse {
  today: string;
  months: AvailableStudyMonth[];
}

export interface StudySession {
  id: string;
  order: number;
  dayId: string;
  studyTableId: string;
  subjectId: string;
  lessonId: string;
  date: string;
  completedAt: string | null;
  lateNotifiedAt: string | null;
  subject: { id: string; title: string };
  lesson: {
    id: string;
    title: string;
    unit: { id: string; title: string };
  };
  status: StudySessionStatus;
}

export interface StudyTableDay {
  id: string;
  date: string;
  studyTableId: string;
  createdAt: string;
  sessions: StudySession[];
}

export interface PlannedDay<TSession = StudySession> {
  date: string;
  sessions: TSession[];
}

export interface PlannedWeek<TSession = StudySession> {
  week: number;
  startDate: string;
  endDate: string;
  days: PlannedDay<TSession>[];
}

export interface PlannedMonth<TSession = StudySession> {
  month: number;
  year: number;
  monthName: string;
  weeks: PlannedWeek<TSession>[];
}

export interface StudyTableDetail extends StudyTableSummary {
  days: StudyTableDay[];
  months?: PlannedMonth[];
}

export interface StudyTableProgress {
  total: number;
  completed: number;
  upcoming: number;
  inProgress: number;
  late: number;
  percent: number;
  byStatus: Record<StudySessionStatus, number>;
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

export interface WeeklyStudyTableInput {
  title: string;
  type: "WEEKLY";
  subjects: SubjectScope;
  startDate: string;
}

export interface DatedStudyTableInput {
  title: string;
  type: "CUSTOM" | "GLOBAL";
  subjects: SubjectScope;
  startDate: string;
  endDate: string;
}

export type StudyTableRangeInput = WeeklyStudyTableInput | DatedStudyTableInput;

export interface MonthlyStudyTableInput {
  title: string;
  type: "MONTHLY";
  subjects: SubjectScope;
  month: number | string;
  year?: number;
}

export type StudyTableInput = StudyTableRangeInput | MonthlyStudyTableInput;

export interface StudyScheduleInput {
  studyWeekdays: number[];
  maxSessionsPerDay: number;
}

export type GenerateStudyTableInput = StudyTableInput & {
  schedule: StudyScheduleInput;
};

export interface PlannedSession {
  subjectId: string;
  lessonId: string;
  date: string;
  order: number;
  subject?: { id: string; title: string };
  lesson?: {
    id: string;
    title: string;
    unit: { id: string; title: string };
  };
  status?: StudySessionStatus;
}

export interface GeneratorSuggestion {
  code:
    | "INCREASE_DAILY_CAPACITY"
    | "ADD_STUDY_DAYS"
    | "EXTEND_DATE_RANGE"
    | "NO_LESSONS"
    | "ALL_LESSONS_COMPLETED";
  message: string;
}

export interface StudyTableGenerationResult {
  preview?: boolean;
  tableId?: string;
  range?: {
    startDate: string;
    endDate: string;
    month?: number;
    year?: number;
    monthStartDate?: string;
    startsFromToday?: boolean;
  };
  sessions: Array<PlannedSession | StudySession>;
  months?: PlannedMonth<PlannedSession | StudySession>[];
  unscheduledLessonsCount: number;
  totalLessons: number;
  scheduledCount: number;
  skippedCompletedCount: number;
  selectedSubjectsCount: number;
  remainingLessonCount?: number;
  capacity: number;
  suggestions: GeneratorSuggestion[];
}

interface StudySessionFields {
  subjectId: string;
  lessonId: string;
  order?: number;
}

export type StudySessionInput = StudySessionFields & (
  | { dayId: string; date?: never }
  | { date: string; dayId?: never }
);

export type StudySessionReplacement = StudySessionFields;

export type UpdateStudySessionInput = Partial<StudySessionFields> & {
  dayId?: string;
  date?: string;
};

export interface StudyTableUpdateInput {
  title?: string;
  startDate?: string;
  endDate?: string;
  month?: number | string;
  year?: number;
  subjects?: SubjectScope;
}

export interface StudySubjectDetails {
  id: string;
  title: string;
  unitsCount: number;
  lessonsCount: number;
  completedLessonsCount: number;
  progressPercent: number;
  units: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      order: number;
      isCompleted: boolean;
    }>;
  }>;
}

export interface StudySubjectSummary {
  id: string;
  title: string;
  unitsCount: number;
  lessonsCount: number;
  completedLessonsCount: number;
  progressPercent: number;
}

export interface CreateStudySubjectInput {
  title: string;
  units: Array<{
    title: string;
    lessons: Array<{ title: string }>;
  }>;
}

export interface ListStudySubjectsResponse {
  data: StudySubjectSummary[];
  pagination: PaginationMeta;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: PaginationMeta;
}
