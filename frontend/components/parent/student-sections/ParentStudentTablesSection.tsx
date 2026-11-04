"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  ListChecks,
  Table2,
} from "lucide-react";
import { PARENT_STUDY_SESSION_FILTER_OPTIONS } from "@/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { ParentOverview, ParentStudySessionFilter } from "@/types/parent";
import { EmptySection, SectionHeading } from "./SectionParts";
import {
  formatArabicDate,
  formatArabicNumber,
  getSubjectColor,
  isBeforeLocalToday,
  isSameLocalDay,
} from "./formatters";

type StudyTableData = ParentOverview["studyTables"][number];
type Day = StudyTableData["days"][number];
type Session = Day["sessions"][number];

/* ───────────── helpers ───────────── */

const formatTime = (v: string | Date) =>
  new Date(v).toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });

const dayLabel = (n: number) => (n === 1 ? "يوم" : n === 2 ? "يومان" : "أيام");
const durationDays = (s: string | Date, e: string | Date) =>
  Math.floor(Math.max(0, new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1;

/** A session is overdue when its day has passed and it was never completed. */
const isOverdue = (day: Day, s: Session) =>
  !s.completedAt && isBeforeLocalToday(day.date);

function getTableStatus(t: StudyTableData, done: number, total: number) {
  if (total > 0 && done === total)
    return { label: "مكتمل", cls: "bg-emerald-500/10 text-emerald-700" };
  const now = new Date();
  const end = new Date(t.endDate);
  end.setHours(23, 59, 59, 999);
  if (now < new Date(t.startDate))
    return { label: "لم يبدأ", cls: "bg-muted text-muted-foreground" };
  if (now > end) return { label: "منتهي", cls: "bg-amber-500/10 text-amber-700" };
  return { label: "جارٍ", cls: "bg-primary/10 text-primary" };
}

/* ───────────── small pieces ───────────── */

function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = percent === 100;
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="نسبة الإنجاز"
        className="h-2 w-full max-w-44 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={
            "h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none " +
            (complete ? "bg-emerald-500" : "bg-primary")
          }
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={
          "text-xs font-semibold tabular-nums " +
          (complete ? "text-emerald-600" : "text-muted-foreground")
        }
      >
        {formatArabicNumber(percent)}٪
      </span>
    </div>
  );
}

function StatusCell({ session, overdue }: { session: Session; overdue: boolean }) {
  if (session.completedAt) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          مكتملة
        </span>
        <div className="text-[11px] tabular-nums text-muted-foreground">
          {formatArabicDate(session.completedAt, { day: "numeric", month: "short" })} ·{" "}
          {formatTime(session.completedAt)}
        </div>
      </div>
    );
  }
  return overdue ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      متأخرة
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Circle className="h-3.5 w-3.5" aria-hidden="true" />
      غير مكتملة
    </span>
  );
}

/* ───────────── overall summary ───────────── */

function OverallSummary({ tables }: { tables: StudyTableData[] }) {
  const entries = tables.flatMap((t) => t.days.flatMap((d) => d.sessions.map((s) => ({ d, s }))));
  const total = entries.length;
  const done = entries.filter(({ s }) => s.completedAt).length;
  const overdue = entries.filter(({ d, s }) => isOverdue(d, s)).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const stats = [
    { label: "إجمالي الجلسات", value: total, tone: "text-foreground" },
    { label: "المكتملة", value: done, tone: "text-emerald-600" },
    { label: "المتأخرة", value: overdue, tone: overdue ? "text-amber-600" : "text-foreground" },
  ];

  return (
    <div className="mb-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
          الإنجاز الكلي
        </p>
        <span className="text-2xl font-bold tabular-nums text-foreground">
          {formatArabicNumber(percent)}٪
        </span>
      </div>
      <div className="mt-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="الإنجاز الكلي"
          className="h-2.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-border">
        {stats.map((s) => (
          <div key={s.label} className="px-3 first:pr-0 last:pl-0">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className={"mt-1 text-lg font-bold tabular-nums " + s.tone}>{formatArabicNumber(s.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ───────────── table with filter ───────────── */

function StudyTable({ days }: { days: Day[] }) {
  const [filter, setFilter] = useState<ParentStudySessionFilter>("all");

  const all = days.flatMap((d) => d.sessions.map((s) => ({ d, s })));
  const counts = {
    all: all.length,
    pending: all.filter(({ s }) => !s.completedAt).length,
    overdue: all.filter(({ d, s }) => isOverdue(d, s)).length,
    done: all.filter(({ s }) => s.completedAt).length,
  };

  const options = PARENT_STUDY_SESSION_FILTER_OPTIONS.filter(
    ({ id }) => id !== "overdue" || counts.overdue > 0,
  );

  const matches = (d: Day, s: Session) =>
    filter === "all" ||
    (filter === "pending" && !s.completedAt) ||
    (filter === "overdue" && isOverdue(d, s)) ||
    (filter === "done" && Boolean(s.completedAt));

  const visibleDays = days
    .map((d) => ({ day: d, rows: d.sessions.filter((s) => matches(d, s)) }))
    .filter(({ day, rows }) =>
      filter === "all" ? true : rows.length > 0 && day.sessions.length > 0,
    );

  return (
    <div className="space-y-3">
      <div role="group" aria-label="تصفية الجلسات" className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = filter === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(o.id)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted")
              }
            >
              {o.label}
              <span className="tabular-nums opacity-80">{formatArabicNumber(counts[o.id])}</span>
            </button>
          );
        })}
      </div>

      {visibleDays.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          لا توجد جلسات مطابقة لهذا الفلتر.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-right text-xs font-semibold text-muted-foreground">
                <th scope="col" className="w-40 px-4 py-3">اليوم</th>
                <th scope="col" className="px-4 py-3">المادة</th>
                <th scope="col" className="px-4 py-3">الدرس</th>
                <th scope="col" className="w-44 px-4 py-3">الحالة</th>
              </tr>
            </thead>

            {visibleDays.map(({ day, rows }) => {
              const today = isSameLocalDay(day.date);
              const total = day.sessions.length;
              const done = day.sessions.filter((s) => s.completedAt).length;
              const dayComplete = total > 0 && done === total;
              const rowSpan = Math.max(rows.length, 1);

              const dayCell = (
                <th
                  scope="rowgroup"
                  rowSpan={rowSpan}
                  className={
                    "border-l border-border px-4 py-3 text-right align-top font-normal " +
                    (today ? "bg-primary/5" : "bg-muted/20")
                  }
                >
                  <div className="font-semibold text-foreground">
                    {formatArabicDate(day.date, { weekday: "long" })}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatArabicDate(day.date, { day: "numeric", month: "long" })}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {today && <Badge className="h-5 px-2 text-[11px]">اليوم</Badge>}
                    {total > 0 && (
                      <span
                        className={
                          "text-xs font-semibold tabular-nums " +
                          (dayComplete ? "text-emerald-600" : "text-muted-foreground")
                        }
                      >
                        {formatArabicNumber(done)}/{formatArabicNumber(total)}
                      </span>
                    )}
                  </div>
                </th>
              );

              return (
                <tbody key={day.id} className="border-t border-border">
                  {rows.length === 0 ? (
                    <tr>
                      {dayCell}
                      <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground">
                        لا توجد جلسات.
                      </td>
                    </tr>
                  ) : (
                    rows.map((session, i) => {
                      const overdue = isOverdue(day, session);
                      return (
                        <tr
                          key={session.id}
                          className={
                            "transition-colors hover:bg-muted/30 " +
                            (i > 0 ? "border-t border-border/60 " : "") +
                            (today ? "bg-primary/[0.03]" : "")
                          }
                        >
                          {i === 0 && dayCell}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 font-medium text-foreground">
                              <span
                                aria-hidden="true"
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: getSubjectColor(session.subject) }}
                              />
                              <span className={session.completedAt ? "text-muted-foreground" : ""}>
                                {session.subject}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {session.lesson || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusCell session={session} overdue={overdue} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}

/* ───────────── section ───────────── */

export function ParentStudentTablesSection({ overview }: { overview: ParentOverview }) {
  return (
    <section>
      <SectionHeading
        title="جداول المذاكرة"
        description="الجلسات المجدولة وحالة إنجازها لكل يوم."
        icon={<Table2 className="h-5 w-5" />}
        count={overview.studyTables.length}
      />

      {overview.studyTables.length === 0 ? (
        <EmptySection icon={<Table2 className="h-5 w-5" />}>
          لا توجد جداول مذاكرة مسجلة.
        </EmptySection>
      ) : (
        <>
          <OverallSummary tables={overview.studyTables} />

          <Accordion dir="rtl" className="space-y-3">
            {overview.studyTables.map((table) => {
              const sessions = table.days.flatMap((d) => d.sessions);
              const total = sessions.length;
              const done = sessions.filter((s) => s.completedAt).length;
              const duration = durationDays(table.startDate, table.endDate);
              const complete = total > 0 && done === total;
              const status = getTableStatus(table, done, total);

              return (
                <AccordionItem
                  key={table.id}
                  value={table.id}
                  className={
                    "overflow-hidden rounded-xl border bg-card px-4 shadow-sm transition-colors data-[state=open]:border-primary/40 sm:px-5 " +
                    (complete ? "border-emerald-500/30" : "border-border")
                  }
                >
                  <AccordionTrigger className="gap-3 py-4 text-right hover:no-underline focus-visible:ring-2 focus-visible:ring-ring [&>svg]:shrink-0">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        aria-hidden="true"
                        className={
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl " +
                          (complete ? "bg-emerald-500/10" : "bg-primary/10")
                        }
                      >
                        <Table2 className={"h-5 w-5 " + (complete ? "text-emerald-600" : "text-primary")} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-bold text-card-foreground">{table.title}</h3>
                          <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + status.cls}>
                            {status.label}
                          </span>
                        </div>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>
                            من {formatArabicDate(table.startDate, { day: "numeric", month: "short" })} إلى {formatArabicDate(table.endDate, { day: "numeric", month: "short" })}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            <span className="tabular-nums">
                              {duration > 2 ? formatArabicNumber(duration) + " " : ""}
                              {dayLabel(duration)}
                            </span>
                          </span>
                        </p>
                        <ProgressBar done={done} total={total} />
                      </div>

                      <Badge variant="secondary" className="shrink-0 tabular-nums">
                        {formatArabicNumber(done)}/{formatArabicNumber(total)} جلسة
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-4">
                    <StudyTable days={table.days} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </>
      )}
    </section>
  );
}