export type QuestionType = "MCQ" | "TRUE_FALSE" | "FILL_BLANK";
export type QuizLanguage = "ar" | "en";

export interface QuizQuestion {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: string[]; // 4 for MCQ, otherwise []
}

export interface AttemptSummary {
  id: string;
  score: number;
  total: number;
  submittedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  bookId: string | null;
  bookTitle: string;
  language: QuizLanguage;
  startPage: number;
  endPage: number;
  createdAt: string;
  questions: QuizQuestion[];
}

export type QuizDetail = Quiz & { attempts: AttemptSummary[] };

export interface QuizListItem {
  id: string;
  title: string;
  bookId: string | null;
  bookTitle: string;
  language: QuizLanguage;
  startPage: number;
  endPage: number;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
  lastAttempt: AttemptSummary | null;
}

export interface QuizPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface WeakPoint {
  topic: string;
  pages: number[];
  wrong: number;
  total: number;
}

export interface ReviewQuestion {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  yourAnswer: string | null; // null = not answered; for MCQ it is the option TEXT
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  pageNumber: number | null;
  topic: string | null;
}

export interface AttemptResult {
  attemptId: string;
  quizId: string;
  title: string;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
  weakPoints: WeakPoint[];
  advice: string | null;
  questions: ReviewQuestion[];
}

// MCQ -> "0".."3", TRUE_FALSE -> "true" | "false", FILL_BLANK -> typed text
export type QuizAnswers = Record<string, string>;

export interface QuizListParams {
  page?: number;
  limit?: number;
  bookId?: string;
}