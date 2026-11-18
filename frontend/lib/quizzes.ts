import { api } from "@/lib/api";
import type {
  AttemptResult,
  Quiz,
  QuizAnswers,
  QuizDetail,
  QuizListItem,
  QuizListParams,
  QuizPagination,
} from "@/types/quiz";

interface Envelope<T> {
  status: "success";
  data: T;
}

// Generating a quiz takes 5 to 40 seconds, so the timeout is longer than usual
const GENERATE_TIMEOUT_MS = 90_000;
const SUBMIT_TIMEOUT_MS = 60_000;

export async function createQuiz(payload: {
  bookId: string;
  message: string;
}): Promise<Quiz> {
  const res = await api.post<Envelope<Quiz>>("/quizzes", payload, {
    timeout: GENERATE_TIMEOUT_MS,
  });
  return res.data.data;
}

export async function listQuizzes(
  params: QuizListParams,
): Promise<{ quizzes: QuizListItem[]; pagination: QuizPagination }> {
  const res = await api.get<
    Envelope<{ quizzes: QuizListItem[]; pagination: QuizPagination }>
  >("/quizzes", {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      ...(params.bookId ? { bookId: params.bookId } : {}),
    },
  });
  return res.data.data;
}

export async function getQuiz(id: string): Promise<QuizDetail> {
  const res = await api.get<Envelope<QuizDetail>>(`/quizzes/${id}`);
  return res.data.data;
}

export async function submitQuiz(
  id: string,
  answers: QuizAnswers,
): Promise<AttemptResult> {
  const res = await api.post<Envelope<AttemptResult>>(
    `/quizzes/${id}/submit`,
    { answers },
    { timeout: SUBMIT_TIMEOUT_MS }, // the server also writes AI advice
  );
  return res.data.data;
}

export async function getAttempt(
  quizId: string,
  attemptId: string,
): Promise<AttemptResult> {
  const res = await api.get<Envelope<AttemptResult>>(
    `/quizzes/${quizId}/attempts/${attemptId}`,
  );
  return res.data.data;
}