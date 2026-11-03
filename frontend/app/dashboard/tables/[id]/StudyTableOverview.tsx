"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, CloudDownload, Loader2, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StudyTableTypeBadge } from "../StudyTableTypeBadge";
import type { StudyTableDetail, StudyTableProgress } from "@/types/study-table";
import { dateLabel } from "./study-table-utils";

interface StudyTableOverviewProps {
  table: StudyTableDetail;
  progress?: StudyTableProgress;
  progressError: boolean;
  isUpdatingTitle: boolean;
  isDownloadingPdf: boolean;
  isDeletingTable: boolean;
  onUpdateTitle: (title: string) => void;
  onDownload: () => void;
  onDelete: () => void;
}

const MAX_SUBJECT_CHIPS = 4;

function ProgressRing({ percent, unavailable }: { percent: number; unavailable: boolean }) {
  const size = 120;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (unavailable ? 0 : percent) / 100);

  return (
    <div
      role="progressbar"
      aria-label="نسبة إنجاز الخطة"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={unavailable ? undefined : percent}
      className="relative size-[120px] shrink-0"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums leading-none text-foreground">
          {unavailable ? "—" : percent}
          {!unavailable && <span className="text-base font-semibold text-muted-foreground">%</span>}
        </span>
        <span className="mt-1 text-[11px] text-muted-foreground">من الخطة</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="space-y-1 px-4 first:ps-0 sm:px-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "success" && "text-emerald-600 dark:text-emerald-400",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StudyTableOverview({
  table,
  progress,
  progressError,
  isUpdatingTitle,
  isDownloadingPdf,
  isDeletingTable,
  onUpdateTitle,
  onDownload,
  onDelete,
}: StudyTableOverviewProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(table.title);
  const percent = Math.round(Math.min(100, Math.max(0, progress?.percent ?? 0)));
  const completed = progress?.completed ?? 0;
  const total = progress?.total ?? 0;
  const late = progress?.late ?? 0;

  const subjectTitles = table.allSubjects ? [] : table.subjects.map(({ subject }) => subject.title);
  const visibleSubjects = subjectTitles.slice(0, MAX_SUBJECT_CHIPS);
  const hiddenSubjects = subjectTitles.slice(MAX_SUBJECT_CHIPS);

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = titleValue.trim();
    if (title && title !== table.title) onUpdateTitle(title);
    setEditingTitle(false);
  }

  function cancelEdit() {
    setTitleValue(table.title);
    setEditingTitle(false);
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Identity + actions */}
      <div className="flex flex-col justify-between gap-6 p-5 sm:p-7 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <StudyTableTypeBadge type={table.type} />

          {editingTitle ? (
            <form className="flex flex-wrap items-center gap-2" onSubmit={saveTitle}>
              <Input
                autoFocus
                value={titleValue}
                maxLength={255}
                aria-label="عنوان الجدول"
                className="h-11 max-w-xl rounded-xl bg-background text-lg font-bold"
                onChange={(event) => setTitleValue(event.target.value)}
                onKeyDown={(event) => event.key === "Escape" && cancelEdit()}
              />
              <Button
                type="submit"
                className="h-11 rounded-xl"
                disabled={isUpdatingTitle || !titleValue.trim()}
              >
                {isUpdatingTitle ? <Loader2 className="size-4 animate-spin" /> : "حفظ"}
              </Button>
              <Button type="button" variant="ghost" className="h-11 rounded-xl" onClick={cancelEdit}>
                إلغاء
              </Button>
            </form>
          ) : (
            <div className="group flex flex-wrap items-center gap-2">
              <h1 className="break-words text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-4xl">
                {table.title}
              </h1>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="تعديل العنوان"
                title="تعديل العنوان"
                className="rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  setTitleValue(table.title);
                  setEditingTitle(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <span>
                {dateLabel(table.startDate)} — {dateLabel(table.endDate)}
              </span>
            </p>

            <div className="flex flex-wrap gap-1.5">
              {table.allSubjects ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  جميع المواد
                </span>
              ) : (
                <>
                  {visibleSubjects.map((title) => (
                    <span
                      key={title}
                      className="max-w-48 truncate rounded-full bg-muted px-3 py-1 text-xs text-foreground/80"
                    >
                      {title}
                    </span>
                  ))}
                  {hiddenSubjects.length > 0 && (
                    <span
                      title={hiddenSubjects.join("، ")}
                      className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                    >
                      +{hiddenSubjects.length}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={onDownload} disabled={isDownloadingPdf} className="h-10 gap-2 rounded-xl">
            {isDownloadingPdf ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CloudDownload className="size-4" />
            )}
            تحميل PDF
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                disabled={isDeletingTable}
                className="h-10 gap-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
                حذف
              </Button>
            }
            title="حذف الجدول؟"
            description={`سيتم حذف "${table.title}" وجميع جلساته.`}
            confirmLabel="حذف"
            onConfirm={onDelete}
          />
        </div>
      </div>

      {/* Progress */}
      <div className="flex flex-col items-center gap-6 border-t border-border/60 bg-muted/25 p-5 sm:flex-row sm:p-7">
        <ProgressRing percent={percent} unavailable={progressError} />

        <div className="w-full flex-1 space-y-3">
          <div className="flex divide-x divide-x-reverse divide-border/70">
            <Stat label="مكتملة" value={progressError ? "—" : completed} tone="success" />
            <Stat
              label="متبقية"
              value={progressError ? "—" : Math.max(0, total - completed)}
            />
            <Stat
              label="متأخرة"
              value={progressError ? "—" : late}
              tone={late > 0 ? "warning" : "default"}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {progressError
              ? "تعذر تحميل التقدم"
              : total === 0
                ? "أضف جلسات لتبدأ بتتبع تقدمك"
                : `${completed} من ${total} جلسة مكتملة`}
          </p>
        </div>
      </div>
    </section>
  );
}