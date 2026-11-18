import Link from "next/link";
import { BookOpen, ChevronLeft } from "lucide-react";
import type { QuizListItem } from "@/types/quiz";
import {
  TONE_LABEL,
  TONE_STYLE,
  formatQuizDate,
  scoreTone,
  toPercent,
} from "@/lib/quiz-utils";

export function QuizCard({ quiz }: { quiz: QuizListItem }) {
  const last = quiz.lastAttempt;
  const percent = last ? toPercent(last.score, last.total) : null;
  const tone = percent !== null ? scoreTone(percent) : null;

  return (
    <Link
      href={`/dashboard/quizzes/${quiz.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* the quiz text follows the quiz language, not the app language */}
        <h3
          dir={quiz.language === "ar" ? "rtl" : "ltr"}
          className="truncate text-sm font-bold text-foreground"
        >
          {quiz.title}
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span dir="auto" className="truncate">
            {quiz.bookTitle}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          الصفحات {quiz.startPage}–{quiz.endPage} · {quiz.questionCount} سؤال ·{" "}
          {quiz.attemptCount} محاولة · {formatQuizDate(quiz.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {percent !== null && tone ? (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLE[tone]}`}
          >
            آخر نتيجة: {percent}% · {TONE_LABEL[tone]}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            لم يُحَل بعد
          </span>
        )}
        <ChevronLeft
          className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}