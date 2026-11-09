"use client";

import type { ReactNode } from "react";
import { CalendarPlus, Check, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  PlannedDay,
  PlannedWeek,
  StudySession,
} from "@/types/study-table";
import { dateLabel } from "./study-table-utils";

interface SessionTableProps {
  days: PlannedDay<StudySession>[];
  onComplete: (id: string, value: boolean) => void;
  onDelete: (id: string) => void;
  onEditDay: (date: string) => void;
}

function localTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dayParts(date: string) {
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("ar-EG", { ...options, timeZone: "UTC" }).format(value);
  return {
    weekday: format({ weekday: "long" }),
    day: format({ day: "numeric" }),
    month: format({ month: "short" }),
  };
}

const headClass = "h-11 text-start text-xs font-semibold text-muted-foreground";

function DayCell({
  day,
  rowSpan,
  isToday,
  completed,
  total,
  onEditDay,
}: {
  day: PlannedDay<StudySession>;
  rowSpan: number;
  isToday: boolean;
  completed: number;
  total: number;
  onEditDay: (date: string) => void;
}) {
  const parts = dayParts(day.date);
  const allDone = total > 0 && completed === total;

  return (
    <TableHead
      rowSpan={rowSpan}
      scope="rowgroup"
      className={cn(
        "w-52 min-w-44 whitespace-normal border-e border-border/60 px-4 py-4 text-start align-top",
        isToday
          ? "border-s-4 border-s-primary bg-primary/[0.05]"
          : "bg-muted/20",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border leading-none transition-colors",
            isToday
              ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "border-border/70 bg-background text-foreground",
          )}
        >
          <span className="text-base font-bold tabular-nums">{parts.day}</span>
          <span
            className={cn(
              "mt-1 text-[10px] font-normal",
              isToday ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          >
            {parts.month}
          </span>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
            {parts.weekday}
            {isToday && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                اليوم
              </span>
            )}
          </p>
          <p
            className={cn(
              "text-xs font-normal",
              allDone
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {total === 0
              ? "لا توجد جلسات"
              : allDone
                ? "اكتمل اليوم"
                : `${completed} من ${total} مكتملة`}
          </p>
          <Button
            size="sm"
            variant="ghost"
            aria-label={`تعديل جلسات ${dateLabel(day.date)}`}
            className="-ms-2 h-7 gap-1.5 rounded-lg px-2 text-xs font-normal text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            onClick={() => onEditDay(day.date)}
          >
            <Pencil className="size-3" />
            تعديل اليوم
          </Button>
        </div>
      </div>
    </TableHead>
  );
}

function StatusCell({
  session,
  overdue,
  onComplete,
}: {
  session: StudySession;
  overdue: boolean;
  onComplete: SessionTableProps["onComplete"];
}) {
  const done = Boolean(session.completedAt);

  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5">
      <Checkbox
        aria-label={`إنجاز ${session.lesson.title}`}
        checked={done}
        onCheckedChange={(checked) => onComplete(session.id, checked === true)}
      />
      {done ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-400">
          <Check className="size-3" aria-hidden />
          مكتمل
        </span>
      ) : overdue ? (
        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-500/15 dark:text-amber-400">
          متأخر
        </span>
      ) : (
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          لم يبدأ
        </span>
      )}
    </label>
  );
}

function StudySessionsTable({ days, onComplete, onDelete, onEditDay }: SessionTableProps) {
  const todayKey = localTodayKey();

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-[780px] text-start">
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-muted/40">
              <TableHead className={cn(headClass, "px-4")}>اليوم</TableHead>
              <TableHead className={headClass}>المادة</TableHead>
              <TableHead className={headClass}>الدرس</TableHead>
              <TableHead className={headClass}>الحالة</TableHead>
              <TableHead className={cn(headClass, "w-16 px-4")}>
                <span className="sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {days.flatMap((day) => {
              const sessions = [...day.sessions].sort((a, b) => a.order - b.order);
              const dayKey = day.date.slice(0, 10);
              const isToday = dayKey === todayKey;
              const isPast = dayKey < todayKey;
              const completed = sessions.filter((s) => s.completedAt).length;
              const rows: ReactNode[] = [];

              if (!sessions.length) {
                rows.push(
                  <TableRow
                    key={`${day.date}-empty`}
                    className="group/empty border-t-2 border-border/70 hover:bg-transparent"
                  >
                    <DayCell
                      day={day}
                      rowSpan={1}
                      isToday={isToday}
                      completed={0}
                      total={0}
                      onEditDay={onEditDay}
                    />
                    <TableCell colSpan={4} className="p-0">
                      <button
                        type="button"
                        onClick={() => onEditDay(day.date)}
                        className="flex h-full min-h-16 w-full items-center gap-2 px-4 text-sm text-muted-foreground transition-colors hover:bg-primary/[0.04] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground transition-colors group-hover/empty:bg-primary/10 group-hover/empty:text-primary">
                          <CalendarPlus className="size-3.5" aria-hidden />
                        </span>
                        إضافة درس لهذا اليوم
                      </button>
                    </TableCell>
                  </TableRow>,
                );
                return rows;
              }

              sessions.forEach((session, index) => {
                const done = Boolean(session.completedAt);
                rows.push(
                  <TableRow
                    key={session.id}
                    className={cn(
                      "group/row border-border/60 transition-colors hover:bg-primary/[0.03]",
                      index === 0 && "border-t-2 border-t-border/70",
                      isToday && "bg-primary/[0.025]",
                    )}
                  >
                    {index === 0 && (
                      <DayCell
                        day={day}
                        rowSpan={sessions.length}
                        isToday={isToday}
                        completed={completed}
                        total={sessions.length}
                        onEditDay={onEditDay}
                      />
                    )}
                    <TableCell className="max-w-56 whitespace-normal py-3.5">
                      <span className="inline-block max-w-full truncate rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                        {session.subject.title}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "max-w-96 whitespace-normal py-3.5 text-sm leading-6",
                        done
                          ? "text-muted-foreground line-through decoration-muted-foreground/40"
                          : "font-medium text-foreground",
                      )}
                    >
                      {session.lesson.title}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <StatusCell
                        session={session}
                        overdue={isPast && !done}
                        onComplete={onComplete}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <ConfirmDialog
                        trigger={
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`حذف ${session.lesson.title}`}
                            title="حذف الجلسة"
                            className="rounded-lg text-muted-foreground opacity-60 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover/row:opacity-100 focus-visible:opacity-100"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        }
                        title="حذف الجلسة؟"
                        description={`سيتم حذف درس "${session.lesson.title}" من هذا الجدول.`}
                        confirmLabel="حذف"
                        onConfirm={() => onDelete(session.id)}
                      />
                    </TableCell>
                  </TableRow>,
                );
              });

              return rows;
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function StudySessionsView({
  weeks,
  days,
  onComplete,
  onDelete,
  onEditDay,
}: SessionTableProps & { weeks?: PlannedWeek[] }) {
  if (!weeks) {
    return (
      <StudySessionsTable
        days={days}
        onComplete={onComplete}
        onDelete={onDelete}
        onEditDay={onEditDay}
      />
    );
  }

  return (
    <div className="space-y-6">
      {weeks.map((week) => {
        const allSessions = week.days.flatMap((day) => day.sessions);
        const done = allSessions.filter((s) => s.completedAt).length;
        return (
          <section key={week.week} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">الأسبوع {week.week}</h2>
                {allSessions.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                    {done}/{allSessions.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {dateLabel(week.startDate)} — {dateLabel(week.endDate)}
              </p>
            </div>
            <StudySessionsTable
              days={week.days}
              onComplete={onComplete}
              onDelete={onDelete}
              onEditDay={onEditDay}
            />
          </section>
        );
      })}
    </div>
  );
}