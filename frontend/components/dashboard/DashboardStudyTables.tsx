"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, Loader2, Moon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listStudyTables, getStudyTableProgress } from "@/lib/study-table";
import { listLessonDates } from "@/lib/lesson-dates";
import { StudyTableTypeBadge } from "@/app/dashboard/tables/StudyTableTypeBadge";
import { ARABIC_DAYS_ORDERED } from "@/lib/day-mapping";
import { ProgressBar } from "@/components/dashboard/home/home-page-components";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const SUBJECT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Same subject always gets the same colour, so students can scan the week by colour.
function subjectColor(subject: string) {
  let hash = 0;
  for (const ch of subject) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`));
}

export default function DashboardStudyTables() {
  const tablesQuery = useQuery({
    queryKey: ["study-tables", "dashboard-summary", 1, 5],
    queryFn: () => listStudyTables({ page: 1, limit: 5 }),
  });
  const lessonDatesQuery = useQuery({
    queryKey: ["lesson-dates"],
    queryFn: listLessonDates,
  });
  const tables = tablesQuery.data?.data ?? [];
  const progressQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: ["study-table-progress", table.id],
      queryFn: () => getStudyTableProgress(table.id),
    })),
  });
  const lessons = lessonDatesQuery.data ?? [];
  const lessonsByDay = new Map(
    WEEK_DAYS.map((day) => [
      day,
      lessons
        .filter((lesson) => lesson.dayName === day)
        .sort((left, right) => left.startTime.localeCompare(right.startTime)),
    ]),
  );
  const progressLoading = progressQueries.some((query) => query.isLoading);
  const progressError = progressQueries.some((query) => query.isError);
  const todayName = ARABIC_DAYS_ORDERED[new Date().getDay()];

  return (
    <section className="grid grid-cols-1 gap-4">
      {/* ------------------------------ Study tables ------------------------------ */}
      <Card className="min-w-0 gap-4 p-5 sm:p-6">
        <CardHeader className="flex flex-row items-start justify-between gap-3 p-0">
          <div>
            <CardTitle className="text-lg font-extrabold">جداول المذاكرة</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              أحدث جداولك ونسبة إنجاز كل جدول
            </CardDescription>
          </div>
          <Link
            href="/dashboard/tables"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {tablesQuery.isLoading || progressLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ تحميل الجداول...
            </div>
          ) : tablesQuery.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              تعذر تحميل جداول المذاكرة. حدّث الصفحة وحاول مرة أخرى.
            </p>
          ) : progressError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              تعذر تحميل تقدم بعض الجداول.
            </p>
          ) : tables.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] py-10 text-center">
              <span className="text-3xl">📅</span>
              <p className="text-sm text-muted-foreground">
                لا توجد جداول مذاكرة بعد. أنشئ أول جدول وابدأ التنظيم.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tables.map((table, index) => {
                const percent = progressQueries[index]?.data?.percent ?? 0;
                const done = percent >= 100;
                return (
                  <li key={table.id}>
                    <Link
                      href={`/dashboard/tables/${table.id}`}
                      className="block rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">
                            {table.title}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            {dateLabel(table.startDate)} — {dateLabel(table.endDate)}
                          </span>
                        </div>
                        <StudyTableTypeBadge type={table.type} />
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <ProgressBar
                          value={percent}
                          label={`إنجاز ${table.title}`}
                          className="h-2.5"
                          barClassName={done ? "bg-emerald-500" : undefined}
                        />
                        <span
                          className={cn(
                            "w-11 shrink-0 text-end text-sm font-extrabold tabular-nums",
                            done ? "text-emerald-500" : "text-primary",
                          )}
                        >
                          {percent}%
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------ Weekly lessons ------------------------------ */}
      <Card className="min-w-0 gap-4 p-5 sm:p-6">
        <CardHeader className="flex flex-row items-start justify-between gap-3 p-0">
          <div>
            <CardTitle className="text-lg font-extrabold">مواعيد الدروس</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              جدولك الأسبوعي من السبت إلى الجمعة
            </CardDescription>
          </div>
          <Link
            href="/dashboard/lesson-dates"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            عرض الجدول <ArrowLeft className="h-4 w-4" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {lessonDatesQuery.isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ تحميل المواعيد...
            </div>
          ) : lessonDatesQuery.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              تعذر تحميل مواعيد الدروس. حدّث الصفحة وحاول مرة أخرى.
            </p>
          ) : (
            <ul className="space-y-2">
              {WEEK_DAYS.map((day) => {
                const dayLessons = lessonsByDay.get(day) ?? [];
                const isToday = todayName === day;
                return (
                  <li
                    key={day}
                    className={cn(
                      "flex gap-3 rounded-2xl border p-3",
                      isToday
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex w-20 shrink-0 flex-col items-start gap-1">
                      <span className="text-sm font-bold text-foreground">
                        {day}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                          اليوم
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {dayLessons.length ? (
                        <div className="flex flex-col gap-2">
                          {dayLessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="rounded-xl border-s-4 bg-muted/50 px-3 py-2"
                              style={{
                                borderInlineStartColor: subjectColor(lesson.subject),
                              }}
                            >
                              <p className="text-sm font-bold text-foreground">
                                {lesson.subject}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="h-3 w-3" />
                                  {lesson.startTime}–{lesson.endTime}
                                </span>
                                <span>{lesson.teacher}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="flex h-full items-center gap-1.5 text-xs text-muted-foreground">
                          <Moon className="h-3.5 w-3.5" />
                          لا دروس، يوم للمراجعة والراحة
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}