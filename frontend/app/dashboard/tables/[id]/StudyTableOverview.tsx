"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CloudDownload,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
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

function ProgressRing({
  percent,
  unavailable,
}: {
  percent: number;
  unavailable: boolean;
}) {
  const size = 120;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (unavailable ? 0 : percent) / 100);
  const complete = !unavailable && percent >= 100;

  return (
    <div
      role="progressbar"
      aria-label="نسبة إنجاز الخطة"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={unavailable ? undefined : percent}
      className="relative size-[120px] shrink-0"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.65" />
          </linearGradient>
        </defs>
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
          stroke={complete ? "hsl(142 71% 45%)" : "url(#ringGradient)"}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums leading-none text-foreground">
          {unavailable ? "—" : percent}
          {!unavailable && (
            <span className="text-base font-semibold text-muted-foreground">%</span>
          )}
        </span>
        <span className="mt-1 text-[11px] text-muted-foreground">
          {complete ? "مكتمل!" : "من الخطة"}
        </span>
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
    <div className="min-w-0 flex-1 space-y-1 px-4 first:ps-0 sm:px-6">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums transition-colors",
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

  const subjectTitles = table.allSubjects
    ? []
    : table.subjects.map(({ subject }) => subject.title);
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
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      {/* Decorative background — subtle dot grid + radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--muted-foreground))_1px,transparent_1px)] [background-size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 end-[-10%] size-80 rounded-full bg-primary/[0.06] blur-3xl"
      />

      {/* Identity + actions */}
      <div className="relative flex flex-col justify-between gap-6 p-5 sm:p-7 lg:flex-row lg:items-start">
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
                {isUpdatingTitle ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "حفظ"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl"
                onClick={cancelEdit}
              >
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
                className="rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus-visible:opacity-100"
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
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-primary/15">
                  جميع المواد
                </span>
              ) : (
                <>
                  {visibleSubjects.map((title) => (
                    <span
                      key={title}
                      className="max-w-48 truncate rounded-full bg-muted px-3 py-1 text-xs text-foreground/80"
                      title={title}
                    >
                      {title}
                    </span>
                  ))}
                  {hiddenSubjects.length > 0 && (
                    <span
                      title={hiddenSubjects.join("، ")}
                      className="cursor-help rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
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
          <Button
            onClick={onDownload}
            disabled={isDownloadingPdf}
            className="h-10 gap-2 rounded-xl shadow-sm shadow-primary/20 transition-transform active:scale-[0.98]"
          >
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
                className="h-10 gap-2 rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
      <div className="relative flex flex-col items-center gap-6 border-t border-border/60 bg-muted/25 p-5 sm:flex-row sm:p-7">
        <ProgressRing percent={percent} unavailable={progressError} />

        <div className="w-full flex-1 space-y-4">
          <div className="flex divide-x divide-x-reverse divide-border/70">
            <Stat
              label="مكتملة"
              value={progressError ? "—" : completed}
              tone="success"
            />
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

          {/* Thin progress bar for quick scan */}
          {!progressError && total > 0 && (
            <div className="space-y-1.5">
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    percent >= 100 ? "bg-emerald-500" : "bg-primary",
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {percent >= 100 && (
                  <CheckCircle2
                    className="size-3.5 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                )}
                {progressError
                  ? "تعذر تحميل التقدم"
                  : total === 0
                    ? "أضف جلسات لتبدأ بتتبع تقدمك"
                    : `${completed} من ${total} جلسة مكتملة`}
              </p>
            </div>
          )}

          {(progressError || total === 0) && (
            <p className="text-xs text-muted-foreground">
              {progressError
                ? "تعذر تحميل التقدم"
                : "أضف جلسات لتبدأ بتتبع تقدمك"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}