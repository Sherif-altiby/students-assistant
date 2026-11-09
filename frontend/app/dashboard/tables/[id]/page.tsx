"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CalendarRange,
  ChevronDown,
  ListChecks,
} from "lucide-react";
import { useStudyTable } from "@/hooks/useStudyTable";
import { cn } from "@/lib/utils";
import type {
  PlannedWeek,
  StudySession,
  StudyTableDay,
} from "@/types/study-table";
import { DaySessionEditor } from "./DaySessionEditor";
import { StudySessionsView } from "./StudySessionsTable";
import { StudyTableOverview } from "./StudyTableOverview";

const TABLES_HREF = "/dashboard/tables";

function BackLink() {
  return (
    <Link
      href={TABLES_HREF}
      className="inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ArrowRight className="size-4" aria-hidden />
      جداول المذاكرة
    </Link>
  );
}

function countSessions(weeks: PlannedWeek<StudySession>[]) {
  let total = 0;
  let done = 0;
  for (const week of weeks) {
    for (const day of week.days) {
      for (const session of day.sessions) {
        total += 1;
        if (session.completedAt) done += 1;
      }
    }
  }
  return { total, done };
}

export default function StudyTableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    table,
    progress,
    isLoading,
    error,
    progressError,
    updateTitle,
    isUpdatingTitle,
    toggleSessionComplete,
    deleteSession,
    replaceDaySessions,
    isReplacingDaySessions,
    downloadPdf,
    isDownloadingPdf,
    deleteTable,
    isDeletingTable,
  } = useStudyTable(id);
  const [editingDay, setEditingDay] = useState<StudyTableDay | null>(null);

  if (isLoading) {
    return (
      <section
        dir="rtl"
        role="status"
        aria-label="جارٍ تحميل جدول المذاكرة"
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6"
      >
        <div className="h-5 w-32 animate-pulse rounded bg-muted/60" />
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="flex flex-col gap-4 p-6 sm:p-7">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted/60" />
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-muted/60" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/50" />
            <div className="mt-2 flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-6 w-20 animate-pulse rounded-full bg-muted/50" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 border-t border-border/60 bg-muted/20 p-6 sm:p-7">
            <div className="size-[120px] shrink-0 animate-pulse rounded-full bg-muted/60" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted/50" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted/50" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !table) {
    return (
      <section dir="rtl" className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6">
        <BackLink />
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-3xl border border-destructive/20 bg-destructive/[0.04] px-6 py-14 text-center shadow-sm"
        >
          <span className="grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <AlertCircle className="size-6" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-foreground">
              تعذر تحميل جدول المذاكرة
            </p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              ربما حُذف الجدول أو حدثت مشكلة في الاتصال. حاول مرة أخرى أو ارجع إلى قائمة الجداول.
            </p>
          </div>
          <Link
            href={TABLES_HREF}
            className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowRight className="size-4" aria-hidden />
            العودة للجداول
          </Link>
        </div>
      </section>
    );
  }
  const tableData = table;

  async function handleDeleteTable() {
    try {
      await deleteTable(id);
      router.push(TABLES_HREF);
    } catch {
      // The mutation reports the failure through the shared toast handler.
    }
  }

  async function handleDownload() {
    try {
      const blob = await downloadPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${tableData.title}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // The mutation reports the failure through the shared toast handler.
    }
  }

  function openDayEditor(date: string) {
    const day = tableData.days.find(
      (item) => item.date.slice(0, 10) === date.slice(0, 10),
    );
    if (day) setEditingDay(day);
  }

  const days = tableData.days.map((day) => ({
    date: day.date,
    sessions: day.sessions,
  }));
  const hasNoSessions = tableData.days.every((day) => day.sessions.length === 0);

  return (
    <section
      dir="rtl"
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6"
    >
      <BackLink />

      <StudyTableOverview
        table={tableData}
        progress={progress}
        progressError={Boolean(progressError)}
        isUpdatingTitle={isUpdatingTitle}
        isDownloadingPdf={isDownloadingPdf}
        isDeletingTable={isDeletingTable}
        onUpdateTitle={updateTitle}
        onDownload={() => void handleDownload()}
        onDelete={() => void handleDeleteTable()}
      />

      {tableData.type === "GLOBAL" && tableData.months ? (
        <div className="space-y-3">
          {tableData.months.map((month) => {
            const weeks = month.weeks as PlannedWeek<StudySession>[];
            const { total, done } = countSessions(weeks);
            const finished = total > 0 && done === total;
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <details
                key={`${month.year}-${month.month}`}
                open={!finished}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow open:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl border transition-colors",
                        finished
                          ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "border-primary/15 bg-primary/10 text-primary",
                      )}
                    >
                      <CalendarRange className="size-4.5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-base font-semibold text-foreground sm:text-lg">
                          {month.monthName} {month.year}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            total === 0
                              ? "bg-muted text-muted-foreground"
                              : finished
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-primary/10 text-primary",
                          )}
                        >
                          {total === 0
                            ? "لا توجد جلسات"
                            : finished
                              ? "اكتمل الشهر"
                              : `${done} من ${total} مكتملة`}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <span
                            aria-hidden
                            className="h-1.5 w-32 overflow-hidden rounded-full bg-muted sm:w-44"
                          >
                            <span
                              className={cn(
                                "block h-full rounded-full transition-[width] duration-500 ease-out",
                                finished ? "bg-emerald-500" : "bg-primary",
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </span>
                          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                            {percent}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-border/60 bg-muted/15 p-4 sm:p-5">
                  <StudySessionsView
                    weeks={weeks}
                    days={[]}
                    onComplete={toggleSessionComplete}
                    onDelete={deleteSession}
                    onEditDay={openDayEditor}
                  />
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <StudySessionsView
          days={days}
          onComplete={toggleSessionComplete}
          onDelete={deleteSession}
          onEditDay={openDayEditor}
        />
      )}

      {hasNoSessions && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <ListChecks className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">لا توجد جلسات في هذا الجدول</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            اضغط «تعديل اليوم» على أي يوم لإضافة دروس وبدء تتبع تقدمك.
          </p>
        </div>
      )}

      {editingDay && (
        <DaySessionEditor
          key={editingDay.id}
          day={editingDay}
          unavailableLessonIds={
            new Set(
              tableData.days
                .filter((day) => day.id !== editingDay.id)
                .flatMap((day) => day.sessions.map((session) => session.lessonId)),
            )
          }
          tableSubjects={tableData.subjects}
          allSubjects={tableData.allSubjects}
          isSaving={isReplacingDaySessions}
          onSave={async (sessions) => {
            try {
              await replaceDaySessions({ dayId: editingDay.id, sessions });
              setEditingDay(null);
            } catch {
              // The mutation reports the failure through the shared toast handler.
            }
          }}
          onClose={() => setEditingDay(null)}
        />
      )}
    </section>
  );
}