"use client";

import { CalendarPlus, CalendarRange, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StudyTableSummary } from "@/types/study-table";
import { StudyTableTypeBadge } from "./StudyTableTypeBadge";

interface StudyTablesTableProps {
  tables: StudyTableSummary[];
  isLoading: boolean;
  /** Kept for backward compatibility: disables every download button. */
  isDownloadingPdf: boolean;
  /** Optional: only this row shows the spinner, the others stay clickable. */
  downloadingId?: string | null;
  /** Optional: shows a "create" button in the empty state. */
  onCreate?: () => void;
  onOpen: (id: string) => void;
  onDownload: (table: StudyTableSummary) => void;
  onDelete: (id: string) => void;
}

const DAY_MS = 86_400_000;
const MAX_VISIBLE_SUBJECTS = 3;

function toUtcDay(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`).getTime();
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(toUtcDay(date)));
}

function yearLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(toUtcDay(date)));
}

function getPeriod(table: StudyTableSummary) {
  const start = toUtcDay(table.startDate);
  const end = toUtcDay(table.endDate);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  const status: "upcoming" | "active" | "ended" =
    today < start ? "upcoming" : today > end ? "ended" : "active";

  const elapsed = Math.min(totalDays, Math.max(0, Math.round((today - start) / DAY_MS) + 1));
  const daysLeft = Math.max(0, Math.round((end - today) / DAY_MS));
  const daysUntilStart = Math.max(0, Math.round((start - today) / DAY_MS));

  return {
    status,
    totalDays,
    progress: status === "active" ? Math.round((elapsed / totalDays) * 100) : status === "ended" ? 100 : 0,
    daysLeft,
    daysUntilStart,
  };
}

const statusStyles = {
  active: {
    label: "جارٍ الآن",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  upcoming: {
    label: "قادم",
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
    bar: "bg-sky-500",
  },
  ended: {
    label: "انتهى",
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
} as const;

function PeriodCell({ table }: { table: StudyTableSummary }) {
  const period = getPeriod(table);
  const style = statusStyles[period.status];

  const hint =
    period.status === "active"
      ? period.daysLeft === 0
        ? "آخر يوم"
        : `متبقي ${period.daysLeft} يوم`
      : period.status === "upcoming"
        ? `يبدأ بعد ${period.daysUntilStart} يوم`
        : `${period.totalDays} يوم`;

  return (
    <div className="flex min-w-48 flex-col gap-2">
      <span className="inline-flex items-center gap-2 text-sm text-foreground">
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="tabular-nums">
          {dateLabel(table.startDate)} – {dateLabel(table.endDate)}
          <span className="ms-1 text-xs text-muted-foreground">
            {yearLabel(table.endDate)}
          </span>
        </span>
      </span>

      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", style.text)}>
          <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
          {style.label}
        </span>
        <span className="text-xs text-muted-foreground">· {hint}</span>
      </div>

      {period.status === "active" && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={period.progress}
          aria-label="تقدم الفترة"
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn("h-full rounded-full transition-[width]", style.bar)}
            style={{ width: `${period.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SubjectsCell({ table }: { table: StudyTableSummary }) {
  if (table.allSubjects) {
    return (
      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        جميع المواد
      </span>
    );
  }

  const titles = table.subjects.map(({ subject }) => subject.title);
  if (!titles.length) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const visible = titles.slice(0, MAX_VISIBLE_SUBJECTS);
  const hidden = titles.slice(MAX_VISIBLE_SUBJECTS);

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((title) => (
        <span
          key={title}
          className="max-w-36 truncate rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/80"
        >
          {title}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          title={hidden.join("، ")}
          className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
        >
          +{hidden.length}
        </span>
      )}
    </div>
  );
}

function RowActions({
  table,
  isDownloading,
  downloadDisabled,
  onDownload,
  onDelete,
}: {
  table: StudyTableSummary;
  isDownloading: boolean;
  downloadDisabled: boolean;
  onDownload: (table: StudyTableSummary) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Button
        size="icon"
        variant="ghost"
        aria-label={`تحميل ${table.title} بصيغة PDF`}
        title="تحميل PDF"
        className="rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
        disabled={downloadDisabled}
        onClick={() => onDownload(table)}
      >
        {isDownloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label={`حذف ${table.title}`}
            title="حذف الجدول"
            className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        }
        title="حذف الجدول؟"
        description={`سيتم حذف "${table.title}" وجميع جلساته.`}
        confirmLabel="حذف"
        onConfirm={() => onDelete(table.id)}
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CalendarRange className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">لا توجد جداول مذاكرة بعد</p>
        <p className="text-sm text-muted-foreground">
          أنشئ جدولاً جديداً لتوزيع موادك على أيام الدراسة.
        </p>
      </div>
      {onCreate && (
        <Button size="sm" onClick={onCreate} className="mt-1 gap-2">
          <CalendarPlus className="size-4" />
          إنشاء جدول
        </Button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-label="جارٍ تحميل جداول المذاكرة"
      className="overflow-hidden rounded-2xl border border-border/70 bg-card"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-6 border-b border-border/60 px-5 py-5 last:border-b-0"
        >
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="hidden h-4 w-48 rounded bg-muted md:block" />
          <div className="hidden h-4 flex-1 rounded bg-muted lg:block" />
          <div className="ms-auto h-8 w-20 rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function StudyTablesTable({
  tables,
  isLoading,
  isDownloadingPdf,
  downloadingId,
  onCreate,
  onOpen,
  onDownload,
  onDelete,
}: StudyTablesTableProps) {
  if (isLoading) return <LoadingState />;

  if (!tables.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card">
        <EmptyState onCreate={onCreate} />
      </div>
    );
  }

  const isRowDownloading = (id: string) =>
    downloadingId !== undefined ? downloadingId === id : isDownloadingPdf;

  const rowKeyDown = (id: string) => (event: React.KeyboardEvent) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(id);
    }
  };

  return (
    <>
      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {tables.map((table) => (
          <li
            key={table.id}
            tabIndex={0}
            role="button"
            aria-label={`فتح جدول ${table.title}`}
            onClick={() => onOpen(table.id)}
            onKeyDown={rowKeyDown(table.id)}
            className="cursor-pointer space-y-4 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <p className="truncate text-sm font-semibold text-foreground">{table.title}</p>
                <StudyTableTypeBadge type={table.type} />
              </div>
              <RowActions
                table={table}
                isDownloading={isRowDownloading(table.id)}
                downloadDisabled={isDownloadingPdf}
                onDownload={onDownload}
                onDelete={onDelete}
              />
            </div>
            <PeriodCell table={table} />
            <SubjectsCell table={table} />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <Table className="min-w-[860px] text-start">
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-muted/40">
                <TableHead className="h-11 px-5 text-start text-xs font-semibold text-muted-foreground">
                  العنوان
                </TableHead>
                <TableHead className="h-11 text-start text-xs font-semibold text-muted-foreground">
                  النوع
                </TableHead>
                <TableHead className="h-11 text-start text-xs font-semibold text-muted-foreground">
                  الفترة
                </TableHead>
                <TableHead className="h-11 text-start text-xs font-semibold text-muted-foreground">
                  المواد
                </TableHead>
                <TableHead className="h-11 px-5 text-start text-xs font-semibold text-muted-foreground">
                  <span className="sr-only">الإجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow
                  key={table.id}
                  tabIndex={0}
                  aria-label={`فتح جدول ${table.title}`}
                  className="group cursor-pointer border-border/60 transition-colors hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  onClick={() => onOpen(table.id)}
                  onKeyDown={rowKeyDown(table.id)}
                >
                  <TableCell className="max-w-64 px-5 py-4 align-top">
                    <span className="block truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {table.title}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <StudyTableTypeBadge type={table.type} />
                  </TableCell>
                  <TableCell className="py-4 align-top">
                    <PeriodCell table={table} />
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal py-4 align-top">
                    <SubjectsCell table={table} />
                  </TableCell>
                  <TableCell className="px-5 py-3 align-top">
                    <div className="transition-opacity md:opacity-60 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <RowActions
                        table={table}
                        isDownloading={isRowDownloading(table.id)}
                        downloadDisabled={isDownloadingPdf}
                        onDownload={onDownload}
                        onDelete={onDelete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}