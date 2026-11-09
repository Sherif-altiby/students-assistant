"use client";

import { AlertTriangle } from "lucide-react";
import { Section } from "./study-table-form-sections";
import { cn } from "@/lib/utils";
import type { StudyTableGenerationResult } from "@/types/study-table";

const th =
  "px-3 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "border-t px-3 py-2.5 align-top";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function sessionRows(
  sessions: StudyTableGenerationResult["sessions"],
  startDate?: string,
  endDate?: string,
  studyWeekdays: number[] = [],
) {
  const grouped = new Map<string, typeof sessions>();
  for (const session of sessions) {
    grouped.set(session.date, [...(grouped.get(session.date) ?? []), session]);
  }
  const dates = new Set(grouped.keys());
  if (startDate && endDate) {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const lastDate = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= lastDate) {
      if (studyWeekdays.includes(cursor.getUTCDay())) {
        dates.add(cursor.toISOString().slice(0, 10));
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return [...dates].sort().flatMap((date) => {
    const items = grouped.get(date) ?? [];
    if (items.length === 0) {
      return (
        <tr key={date}>
          <th
            scope="row"
            className={`${td} whitespace-nowrap text-start font-medium`}
          >
            {formatDate(date)}
          </th>
          <td colSpan={2} className={`${td} text-muted-foreground`}>
            لا توجد جلسات
          </td>
        </tr>
      );
    }
    return items.map((session, index) => (
      <tr key={`${date}-${session.lessonId}`}>
        {index === 0 && (
          <th
            scope="row"
            rowSpan={items.length}
            className={`${td} whitespace-nowrap border-e bg-muted/30 text-start font-medium`}
          >
            {formatDate(date)}
          </th>
        )}
        <td className={td}>{session.subject?.title ?? "—"}</td>
        <td className={td}>{session.lesson?.title ?? "—"}</td>
      </tr>
    ));
  });
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "primary" | "warning" | "success";
}) {
  const tones: Record<string, string> = {
    default: "border-border bg-background",
    primary: "border-primary/20 bg-primary/5",
    warning:
      "border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    success:
      "border-emerald-300/60 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
  };
  const valueTones: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    warning: "text-amber-700 dark:text-amber-300",
    success: "text-emerald-700 dark:text-emerald-300",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md",
        tones[tone],
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tabular-nums",
          valueTones[tone],
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StudyTablePreview({
  preview,
  studyWeekdays,
  eligibleDays,
  averagePerDay,
}: {
  preview: StudyTableGenerationResult;
  studyWeekdays: number[];
  eligibleDays: number;
  averagePerDay: string;
}) {
  return (
    <Section title="معاينة الخطة">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="دروس مجدولة"
          value={`${preview.scheduledCount} / ${preview.totalLessons}`}
          tone="primary"
        />
        <Stat label="أيام المذاكرة" value={eligibleDays} tone="success" />
        <Stat label="المتوسط اليومي" value={averagePerDay} />
        <Stat label="السعة" value={preview.capacity} />
      </div>

      {(preview.skippedCompletedCount > 0 ||
        preview.unscheduledLessonsCount > 0) && (
        <p className="text-sm text-muted-foreground">
          {preview.skippedCompletedCount > 0 &&
            `${preview.skippedCompletedCount} درس مكتمل تم تخطيه`}
          {preview.skippedCompletedCount > 0 &&
            preview.unscheduledLessonsCount > 0 &&
            " — "}
          {preview.unscheduledLessonsCount > 0 &&
            `${preview.unscheduledLessonsCount} درس غير مجدول`}
        </p>
      )}

      {preview.suggestions.length > 0 && (
        <div
          role="status"
          className="flex gap-2.5 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <ul className="space-y-1">
            {preview.suggestions.map((suggestion) => (
              <li key={suggestion.code}>{suggestion.message}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.months?.map((month) => (
        <details
          key={`${month.year}-${month.month}`}
          open
          className="group space-y-2"
        >
          <summary className="cursor-pointer text-sm font-semibold marker:text-muted-foreground">
            {month.monthName} {month.year}
          </summary>
          <div className="overflow-x-auto rounded-xl border border-border/70 shadow-sm">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur">
                <tr>
                  <th className={th}>الأسبوع</th>
                  <th className={th}>الأيام</th>
                  <th className={th}>المواد</th>
                  <th className={th}>الدروس</th>
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                {month.weeks.map((week) => (
                  <tr key={week.week}>
                    <th
                      scope="row"
                      className={`${td} whitespace-nowrap text-start font-medium`}
                    >
                      الأسبوع {week.week}
                    </th>
                    <td className={td}>
                      {week.days.map((day) => formatDate(day.date)).join("، ")}
                    </td>
                    <td className={td}>
                      {week.days
                        .flatMap((day) => day.sessions)
                        .map((session) => session.subject?.title ?? "—")
                        .join("، ")}
                    </td>
                    <td className={td}>
                      {week.days
                        .flatMap((day) => day.sessions)
                        .map((session) => session.lesson?.title ?? "—")
                        .join("، ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}

      {!preview.months && (
        <div className="max-h-72 overflow-auto rounded-xl border border-border/70 shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="sticky top-0 z-[1] bg-muted/80 backdrop-blur">
              <tr>
                <th className={th}>اليوم</th>
                <th className={th}>المادة</th>
                <th className={th}>الدرس</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
              {sessionRows(
                preview.sessions,
                preview.range?.startDate,
                preview.range?.endDate,
                studyWeekdays,
              )}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}