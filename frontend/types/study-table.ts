export type StudyTableType = "DATE_RANGE" | "NUMBER_OF_DAYS";

export interface StudyTableSummary {
  id: string;
  title: string;
  type: StudyTableType;
  startDate: string;
  endDate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTableDaySimple {
  id: string;
  date: string;
  studyTableId: string;
  createdAt: string;
}

export interface StudyTableCreateResponse extends StudyTableSummary {
  days: StudyTableDaySimple[];
}

export interface LessonCompletion {
  id: string;
  completedAt: string;
  userId: string;
  lessonId: string;
}

export interface DayLesson {
  id: string;
  title: string;
  chapterId: string;
  createdAt: string;
  completions: LessonCompletion[];
}

export interface DayChapter {
  id: string;
  title: string;
  subjectId: string;
  createdAt: string;
  lessons: DayLesson[];
}

export interface DaySubject {
  id: string;
  title: string;
  dayId: string;
  createdAt: string;
  chapters: DayChapter[];
}

export interface StudyTableDayDetailed extends StudyTableDaySimple {
  subjects: DaySubject[];
}

export interface StudyTableDetail extends StudyTableSummary {
  days: StudyTableDayDetailed[];
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

// ---- create payloads ----
export interface CreateStudyTableDateRangePayload {
  title: string;
  type: "DATE_RANGE";
  startDate: string;
  endDate: string;
}

export interface CreateStudyTableNumberOfDaysPayload {
  title: string;
  type: "NUMBER_OF_DAYS";
  numberOfDays: number;
}

export type CreateStudyTablePayload =
  | CreateStudyTableDateRangePayload
  | CreateStudyTableNumberOfDaysPayload;

export interface UpdateStudyTablePayload {
  title: string;
}

// ---- day subjects payload ----
export interface DaySubjectsLessonPayload {
  title: string;
}

export interface DaySubjectsChapterPayload {
  title: string;
  lessons: DaySubjectsLessonPayload[];
}

export interface DaySubjectsSubjectPayload {
  title: string;
  chapters: DaySubjectsChapterPayload[];
}

export interface UpdateDaySubjectsPayload {
  subjects: DaySubjectsSubjectPayload[];
}
