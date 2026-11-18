"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lightbulb, Minus, PartyPopper, Target, X } from "lucide-react";
import type { AttemptResult, QuizLanguage } from "@/types/quiz";
import { displayYourAnswer, dirOf, pageLabel } from "@/lib/quiz-text";
import { TONE_LABEL, TONE_STYLE, formatQuizDate, scoreTone } from "@/lib/quiz-utils";
import { BlankPrompt } from "./BlankPrompt";
import { ScoreRing } from "./ScoreRing";

function scoreMessage(percent: number): string {
  if (percent < 50) return "تحتاج إلى مراجعة الأجزاء الضعيفة ثم إعادة المحاولة.";
  if (percent < 80) return "مستوى جيد، بقي القليل لتتقن هذا الجزء.";
  return "ممتاز، أداء رائع!";
}

export function ResultView({
  attempt,
  language,
}: {
  attempt: AttemptResult;
  language: QuizLanguage;
}) {
  const [wrongOnly, setWrongOnly] = useState(false);

  const percent = Math.round(attempt.percentage);
  const tone = scoreTone(percent);

  const ordered = [...attempt.questions].sort((a, b) => a.position - b.position);
  const wrongCount = ordered.filter((q) => !q.isCorrect).length;
  const visible = wrongOnly ? ordered.filter((q) => !q.isCorrect) : ordered;

  return (
    <div className="space-y-5">
      {/* ---------- score ---------- */}
      <section
        aria-labelledby="score-title"
        className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:p-6"
      >
        <ScoreRing percentage={percent} tone={tone} />
        <div className="flex-1 space-y-2 text-center sm:text-start">
          <h2 id="score-title" className="text-3xl font-black text-foreground">
            {attempt.score} / {attempt.total}
          </h2>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${TONE_STYLE[tone]}`}
          >
            {TONE_LABEL[tone]}
          </span>
          <p className="text-sm text-muted-foreground">{scoreMessage(percent)}</p>
          <p className="text-xs text-muted-foreground">
            {formatQuizDate(attempt.submittedAt)}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1 sm:justify-start">
            <Link
              href={`/dashboard/quizzes/${attempt.quizId}`}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              إعادة الكويز
            </Link>
            <Link
              href="/dashboard/quizzes"
              className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              كل الكويزات
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- weak points ---------- */}
      <section
        aria-labelledby="weak-title"
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <h3 id="weak-title" className="flex items-center gap-2 text-base font-bold text-foreground">
          <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          نقاط الضعف
        </h3>

        {attempt.weakPoints.length === 0 ? (
          <p className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3.5 py-3 text-sm text-green-700 dark:text-green-400">
            <PartyPopper className="h-4 w-4 shrink-0" aria-hidden="true" />
            لا توجد نقاط ضعف واضحة، أحسنت!
          </p>
        ) : (
          <ul className="space-y-2.5">
            {attempt.weakPoints.map((point) => (
              <li
                key={point.topic}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5"
              >
                <div className="space-y-1.5">
                  <p dir={dirOf(language)} className="text-sm font-medium text-foreground">
                    {point.topic}
                  </p>
                  {point.pages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {point.pages.map((page) => (
                        <span
                          key={page}
                          dir={dirOf(language)}
                          className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {pageLabel(language, page)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  أخطأت في {point.wrong} من {point.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- advice (hidden when there is none) ---------- */}
      {attempt.advice && (
        <section
          aria-labelledby="advice-title"
          className="space-y-2 rounded-2xl border border-border bg-card p-5"
        >
          <h3 id="advice-title" className="flex items-center gap-2 text-base font-bold text-foreground">
            <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
            نصائح للمذاكرة
          </h3>
          <p dir="auto" className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {attempt.advice}
          </p>
        </section>
      )}

      {/* ---------- review ---------- */}
      <section aria-labelledby="review-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="review-title" className="text-base font-bold text-foreground">
            مراجعة الأسئلة
          </h3>
          <button
            type="button"
            aria-pressed={wrongOnly}
            onClick={() => setWrongOnly((v) => !v)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              wrongOnly
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {wrongOnly ? "عرض كل الأسئلة" : `عرض الأخطاء فقط (${wrongCount})`}
          </button>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card py-8 text-center text-sm text-muted-foreground">
            لا توجد أخطاء لعرضها
          </p>
        ) : (
          <ol className="space-y-3">
            {visible.map((q) => {
              const yourAnswer = displayYourAnswer(q, language);
              const unanswered = yourAnswer === null;
              return (
                <li
                  key={q.id}
                  className="space-y-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      سؤال {q.position}
                    </span>

                    {/* icon + text, never color alone */}
                    {q.isCorrect ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        إجابة صحيحة
                      </span>
                    ) : unanswered ? (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        لم تتم الإجابة
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        إجابة خاطئة
                      </span>
                    )}

                    {q.pageNumber !== null && (
                      <span
                        dir={dirOf(language)}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {pageLabel(language, q.pageNumber)}
                      </span>
                    )}
                  </div>

                  <p
                    dir={dirOf(language)}
                    className="text-sm font-bold leading-relaxed text-foreground"
                  >
                    {q.type === "FILL_BLANK" ? <BlankPrompt prompt={q.prompt} /> : q.prompt}
                  </p>

                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">إجابتك</dt>
                      <dd dir={dirOf(language)} className="text-foreground">
                        {unanswered ? (
                          <span dir="rtl" className="text-muted-foreground">
                            لم تجب عن هذا السؤال
                          </span>
                        ) : (
                          yourAnswer
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">الإجابة الصحيحة</dt>
                      <dd dir={dirOf(language)} className="font-medium text-foreground">
                        {q.correctAnswer}
                      </dd>
                    </div>
                  </dl>

                  {q.explanation && (
                    <p
                      dir={dirOf(language)}
                      className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      {q.explanation}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}