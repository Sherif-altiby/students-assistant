"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useQuiz, useSubmitQuiz } from "@/hooks/useQuizzes";
import { useQuizDraft } from "@/hooks/useQuizDraft";
import { dirOf } from "@/lib/quiz-text";
import {
  TONE_LABEL,
  TONE_STYLE,
  formatQuizDate,
  scoreTone,
  toPercent,
} from "@/lib/quiz-utils";
import type { QuizAnswers, QuizDetail } from "@/types/quiz";
import { QuestionView } from "./QuestionView";
import { ConfirmSubmitDialog } from "./ConfirmSubmitDialog";
import { QuizErrorState } from "./QuizErrorState";

export function QuizTaker({ quizId }: { quizId: string }) {
  const { quiz, isLoading, error, refetch } = useQuiz(quizId);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 p-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted/40" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <QuizErrorState
        error={error}
        onRetry={() => refetch()}
        backHref="/dashboard/quizzes"
      />
    );
  }

  return <QuizTakerBody quiz={quiz} />;
}

function QuizTakerBody({ quiz }: { quiz: QuizDetail }) {
  const router = useRouter();

  const questions = useMemo(
    () => [...quiz.questions].sort((a, b) => a.position - b.position),
    [quiz.questions],
  );
  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);

  const { answers, setAnswer, clear } = useQuizDraft(quiz.id, questionIds);
  const { submit, isSubmitting, error } = useSubmitQuiz(quiz.id);

  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const questionRef = useRef<HTMLElement>(null);
  const movedByUser = useRef(false);

  // After the student moves to another question, focus goes to it
  useEffect(() => {
    if (movedByUser.current) questionRef.current?.focus();
  }, [index]);

  const total = questions.length;
  const current = questions[index];

  const isAnswered = (id: string) => (answers[id] ?? "").trim() !== "";
  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;
  const unansweredNumbers = questions
    .map((q, i) => (isAnswered(q.id) ? null : i + 1))
    .filter((n): n is number => n !== null);

  if (!current) {
    return (
      <QuizErrorState
        error={null}
        onRetry={() => undefined}
        backHref="/dashboard/quizzes"
      />
    );
  }

  function go(target: number) {
    movedByUser.current = true;
    setIndex(Math.min(Math.max(target, 0), total - 1));
  }

  function doSubmit() {
    setConfirmOpen(false);

    // only the questions the student answered are sent
    const payload: QuizAnswers = {};
    for (const q of questions) {
      const value = (answers[q.id] ?? "").trim();
      if (value) payload[q.id] = value;
    }

    submit(payload, {
      onSuccess: (result) => {
        clear();
        router.push(
          `/dashboard/quizzes/${quiz.id}/attempts/${result.attemptId}`,
        );
      },
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "Enter" || isSubmitting) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "BUTTON" || tag === "TEXTAREA") return;
    // Enter moves to the next question; it never submits by accident
    if (index < total - 1) {
      e.preventDefault();
      go(index + 1);
    }
  }

  const isLast = index === total - 1;
  const canRetry =
    error?.kind === "ai_unavailable" ||
    error?.kind === "network" ||
    error?.kind === "timeout";

  return (
    <div dir="rtl" className="mx-auto w-full max-w-6xl space-y-5 p-4">
      <PageHeader
        title={quiz.title}
        description={`${quiz.bookTitle} · الصفحات ${quiz.startPage}–${quiz.endPage}`}
        icon={<ClipboardList className="h-5 w-5" />}
        action={
          <Link
            href="/dashboard/quizzes"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            كل الكويزات
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* ---------- question ---------- */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                سؤال {index + 1} / {total}
              </span>
              <span className="text-xs text-muted-foreground">
                أجبت عن {answeredCount}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="التقدم في الكويز"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={index + 1}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${((index + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <section
            ref={questionRef}
            tabIndex={-1}
            aria-label={`سؤال ${index + 1} من ${total}`}
            onKeyDown={handleKeyDown}
            dir={dirOf(quiz.language)}
            className="rounded-2xl border border-border bg-card p-4 outline-none sm:p-6"
          >
            <QuestionView
              key={current.id}
              question={current}
              value={answers[current.id] ?? ""}
              language={quiz.language}
              disabled={isSubmitting}
              onChange={(value) => setAnswer(current.id, value)}
            />
          </section>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0 || isSubmitting}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              السابق
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                تسليم الكويز
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(index + 1)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                التالي
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div aria-live="assertive">
            {error && (
              <div
                role="alert"
                className="space-y-2.5 rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
              >
                <p>{error.message}</p>
                {canRetry && (
                  <button
                    type="button"
                    onClick={doSubmit}
                    className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    إعادة محاولة التسليم
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ---------- side: navigator + previous attempts ---------- */}
        <aside className="space-y-4">
          <nav
            aria-label="التنقل بين الأسئلة"
            className="rounded-2xl border border-border bg-card p-4"
          >
            <h3 className="mb-3 text-sm font-bold text-foreground">الأسئلة</h3>
            <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-5">
              {questions.map((q, i) => {
                const answered = isAnswered(q.id);
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => go(i)}
                      disabled={isSubmitting}
                      aria-current={i === index ? "step" : undefined}
                      aria-label={`سؤال ${i + 1}، ${answered ? "تمت الإجابة" : "بدون إجابة"}`}
                      className={`relative flex h-9 w-full items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                        answered
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      } ${i === index ? "ring-2 ring-primary" : ""}`}
                    >
                      {i + 1}
                      {answered && (
                        <Check
                          className="absolute -end-1 -top-1 h-3.5 w-3.5 rounded-full bg-primary p-0.5 text-primary-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs text-muted-foreground">
              تمت الإجابة عن {answeredCount} من {total}
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isSubmitting}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              تسليم الكويز
            </button>
          </nav>

          {quiz.attempts.length > 0 && (
            <section
              aria-labelledby="attempts-title"
              className="rounded-2xl border border-border bg-card p-4"
            >
              <h3 id="attempts-title" className="mb-3 text-sm font-bold text-foreground">
                محاولاتك السابقة
              </h3>
              <ul className="space-y-2">
                {quiz.attempts.map((attempt) => {
                  const percent = toPercent(attempt.score, attempt.total);
                  const tone = scoreTone(percent);
                  return (
                    <li key={attempt.id}>
                      <Link
                        href={`/dashboard/quizzes/${quiz.id}/attempts/${attempt.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-xs hover:border-primary/40"
                      >
                        <span className="text-muted-foreground">
                          {formatQuizDate(attempt.submittedAt)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${TONE_STYLE[tone]}`}
                        >
                          {attempt.score}/{attempt.total} · {percent}% ·{" "}
                          {TONE_LABEL[tone]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <ConfirmSubmitDialog
        open={confirmOpen}
        total={total}
        unansweredNumbers={unansweredNumbers}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
      />

      {isSubmitting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            جارٍ تصحيح إجاباتك وتجهيز النصائح...
          </p>
          <p className="text-xs text-muted-foreground">
            قد يستغرق الأمر عدة ثوانٍ، لا تغلق الصفحة
          </p>
        </div>
      )}
    </div>
  );
}