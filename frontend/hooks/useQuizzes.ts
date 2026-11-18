"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createQuiz,
  getAttempt,
  getQuiz,
  listQuizzes,
  submitQuiz,
} from "@/lib/quizzes";
import { toQuizError } from "@/lib/quiz-errors";
import type { QuizAnswers, QuizListParams } from "@/types/quiz";

export function useCreateQuiz() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });

  return {
    create: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.isError ? toQuizError(mutation.error) : null,
    reset: mutation.reset,
  };
}

export function useQuizzes(params: QuizListParams) {
  const query = useQuery({
    queryKey: ["quizzes", "list", params],
    queryFn: () => listQuizzes(params),
    placeholderData: keepPreviousData,
  });

  return {
    quizzes: query.data?.quizzes ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? toQuizError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useQuiz(id: string) {
  const query = useQuery({
    queryKey: ["quizzes", "detail", id],
    queryFn: () => getQuiz(id),
  });

  return {
    quiz: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? toQuizError(query.error) : null,
    refetch: query.refetch,
  };
}

export function useSubmitQuiz(quizId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (answers: QuizAnswers) => submitQuiz(quizId, answers),
    onSuccess: (result) => {
      // the result page can open instantly without another request
      queryClient.setQueryData(
        ["quizzes", "attempt", quizId, result.attemptId],
        result,
      );
      queryClient.invalidateQueries({ queryKey: ["quizzes", "list"] });
      queryClient.invalidateQueries({ queryKey: ["quizzes", "detail", quizId] });
    },
  });

  return {
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    error: mutation.isError ? toQuizError(mutation.error) : null,
    reset: mutation.reset,
  };
}

export function useAttempt(quizId: string, attemptId: string) {
  const query = useQuery({
    queryKey: ["quizzes", "attempt", quizId, attemptId],
    queryFn: () => getAttempt(quizId, attemptId),
  });

  return {
    attempt: query.data ?? null,
    isLoading: query.isLoading,
    error: query.isError ? toQuizError(query.error) : null,
    refetch: query.refetch,
  };
}