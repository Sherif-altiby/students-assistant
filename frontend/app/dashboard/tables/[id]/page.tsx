"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useStudyTable } from "@/hooks/useStudyTable";
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
      className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
      <main
        dir="rtl"
        role="status"
        aria-label="جارٍ تحميل جدول المذاكرة"
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6"
      >
        <div className="h-5 w-32 animate-pulse rounded bg-muted/60" />
        <div className="h-72 animate-pulse rounded-3xl bg-muted/50" />
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !table) {
    return (
      <main dir="rtl" className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6">
        <BackLink />
        <div
          role="alert"
          className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center"
        >
          <p className="text-sm font-semibold text-destructive">
            تعذر تحميل جدول المذاكرة
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ربما حُذف الجدول أو حدثت مشكلة في الاتصال. حاول مرة أخرى أو ارجع إلى قائمة الجداول.
          </p>
        </div>
      </main>
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
    <main dir="rtl" className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 sm:p-6">
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
        <div className="space-y-4">
          {tableData.months.map((month) => {
            const weeks = month.weeks as PlannedWeek<StudySession>[];
            const { total, done } = countSessions(weeks);
            const finished = total > 0 && done === total;

            return (
              <details
                key={`${month.year}-${month.month}`}
                // Finished months start collapsed so unfinished work is what you see first.
                open={!finished}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
              >
                <summary className="cursor-pointer list-none px-5 py-4 marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-lg font-semibold text-foreground">
                        {month.monthName} {month.year}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {total === 0
                          ? "لا توجد جلسات"
                          : finished
                            ? "اكتمل الشهر"
                            : `${done} من ${total} مكتملة`}
                      </span>
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </span>
                  {total > 0 && (
                    <span
                      aria-hidden
                      className="mt-3 block h-1 overflow-hidden rounded-full bg-muted"
                    >
                      <span
                        className="block h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${Math.round((done / total) * 100)}%` }}
                      />
                    </span>
                  )}
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
        <p className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          لا توجد جلسات في هذا الجدول. اضغط «تعديل اليوم» على أي يوم لإضافة دروس.
        </p>
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
    </main>
  );
}