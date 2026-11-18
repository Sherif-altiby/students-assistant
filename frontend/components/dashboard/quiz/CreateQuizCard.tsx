"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import MainButton from "@/components/ui/MainButton";
import { useCreateQuiz } from "@/hooks/useQuizzes";
import {
  QUIZ_EXAMPLES,
  QUIZ_MESSAGE_MAX,
  QUIZ_MESSAGE_MIN,
  QUIZ_PROGRESS_STEPS,
} from "@/constants/index";

const STEP_INTERVAL_MS = 7000;

export function CreateQuizCard({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { create, isCreating, error, reset } = useCreateQuiz();
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Cycle the progress text while the server works
  useEffect(() => {
    if (!isCreating) {
      setStep(0);
      return;
    }
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, QUIZ_PROGRESS_STEPS.length - 1)),
      STEP_INTERVAL_MS,
    );
    return () => clearInterval(timer);
  }, [isCreating]);

  const trimmed = message.trim();
  const canSubmit =
    trimmed.length >= QUIZ_MESSAGE_MIN &&
    trimmed.length <= QUIZ_MESSAGE_MAX &&
    !isCreating;

  function generate() {
    if (!canSubmit) return;
    create(
      { bookId, message: trimmed },
      { onSuccess: (quiz) => router.push(`/dashboard/quizzes/${quiz.id}`) },
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    generate();
  }

  function pickExample(example: string) {
    reset();
    setMessage(example);
    textareaRef.current?.focus();
  }

  function chooseOtherPages() {
    reset();
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }

  return (
    <form
      dir="rtl"
      onSubmit={handleSubmit}
      aria-busy={isCreating}
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <ClipboardList className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">اعمل كويز</h2>
          <p className="text-xs text-muted-foreground">
            اكتب طلبك بكلامك العادي، وحدّد الصفحات وعدد الأسئلة لو تحب
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="quiz-request" className="sr-only">
          طلب الكويز
        </label>
        <textarea
          id="quiz-request"
          ref={textareaRef}
          dir="auto"
          rows={3}
          value={message}
          maxLength={QUIZ_MESSAGE_MAX}
          disabled={isCreating}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="مثال: اعملي كويز على أول 10 صفحات"
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          {trimmed.length} / {QUIZ_MESSAGE_MAX}
        </p>
      </div>

      <div
        className={`space-y-2 rounded-xl p-2 ${
          error?.kind === "range_missing" ? "ring-2 ring-primary/40" : ""
        }`}
      >
        <p className="text-xs text-muted-foreground">أمثلة (اضغط لتجربتها):</p>
        <div className="flex flex-wrap gap-2">
          {QUIZ_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              dir="auto"
              disabled={isCreating}
              onClick={() => pickExample(example)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div aria-live="polite" role="status">
        {isCreating && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {QUIZ_PROGRESS_STEPS[step]}
            <span className="text-xs">
              (قد يستغرق حتى دقيقة، لا تغلق الصفحة)
            </span>
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="space-y-2.5 rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
        >
          <p>{error.message}</p>

          {error.kind === "generation_failed" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={generate}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                حاول مرة أخرى
              </button>
              <button
                type="button"
                onClick={chooseOtherPages}
                className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10"
              >
                اختر صفحات أخرى
              </button>
            </div>
          )}

          {(error.kind === "ai_unavailable" ||
            error.kind === "network" ||
            error.kind === "timeout") && (
            <button
              type="button"
              onClick={generate}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              إعادة المحاولة
            </button>
          )}
        </div>
      )}

      <MainButton
        type="submit"
        disabled={!canSubmit}
        className="px-6"
        icon={
          isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ClipboardList className="h-4 w-4" />
          )
        }
        title={isCreating ? "جارٍ إنشاء الكويز..." : "إنشاء الكويز"}
      />
    </form>
  );
}