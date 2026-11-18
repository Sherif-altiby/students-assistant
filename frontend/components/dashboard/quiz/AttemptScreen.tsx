"use client";

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAttempt, useQuiz } from "@/hooks/useQuizzes";
import { hasArabic } from "@/lib/quiz-text";
import { formatQuizDate } from "@/lib/quiz-utils";
import { QuizErrorState } from "./QuizErrorState";
import { ResultView } from "./ResultView";

export function AttemptScreen({
  quizId,
  attemptId,
}: {
  quizId: string;
  attemptId: string;
}) {
  const { attempt, isLoading, error, refetch } = useAttempt(quizId, attemptId);
  // the attempt does not carry the quiz language, so it comes from the quiz itself
  const { quiz } = useQuiz(quizId);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 p-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-muted/40" />
        <div className="h-32 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <QuizErrorState
        error={error}
        onRetry={() => refetch()}
        backHref="/dashboard/quizzes"
      />
    );
  }

  const language = quiz?.language ?? (hasArabic(attempt.title) ? "ar" : "en");

  return (
    <div dir="rtl" className="mx-auto w-full max-w-4xl space-y-5 p-4">
      <PageHeader
        title={attempt.title}
        description={`نتيجة محاولة بتاريخ ${formatQuizDate(attempt.submittedAt)}`}
        icon={<ClipboardList className="h-5 w-5" />}
      />
      <ResultView attempt={attempt} language={language} />
    </div>
  );
}