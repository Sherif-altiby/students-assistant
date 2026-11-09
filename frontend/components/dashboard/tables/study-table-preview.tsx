"use client";

import { AlertTriangle } from "lucide-react";
import { Section } from "./study-table-form-sections";
import type { StudyTableGenerationResult } from "@/types/study-table";

const th = "px-3 py-2.5 text-start text-xs font-medium text-muted-foreground";
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
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
        />
        <Stat label="أيام المذاكرة" value={eligibleDays} />
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
          className="flex gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
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
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className={th}>الأسبوع</th>
                  <th className={th}>الأيام</th>
                  <th className={th}>المواد</th>
                  <th className={th}>الدروس</th>
                </tr>
              </thead>
              <tbody>
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
        <div className="max-h-72 overflow-auto rounded-lg border bg-background">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr>
                <th className={th}>اليوم</th>
                <th className={th}>المادة</th>
                <th className={th}>الدرس</th>
              </tr>
            </thead>
            <tbody>
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
