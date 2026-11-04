"use client";

import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, CalendarCheck, Table2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getStudyTableProgress, listStudyTables } from "@/lib/study-table";

function getEncouragement(percent: number, total: number) {
  if (total === 0) return "لا توجد جلسات بعد في جداولك.";
  if (percent === 100) return "أنجزت كل الجلسات! أحسنت  ";
  if (percent >= 75) return "اقتربت من خط النهاية، جلسات قليلة وتنتهي  ";
  if (percent >= 40) return "تتقدم بثبات، استمر على هذا الإيقاع  ";
  if (percent > 0) return "بداية موفقة، خطوة بعد خطوة  ";
  return "ابدأ أول جلسة وسيظهر تقدمك هنا  ";
}

export default function StudyTableProgressChart() {
  const tablesQuery = useQuery({
    queryKey: ["study-tables", "dashboard-progress", 1, 6],
    queryFn: () => listStudyTables({ page: 1, limit: 6 }),
  });
  const tables = tablesQuery.data?.data ?? [];
  const progressQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: ["study-table-progress", table.id],
      queryFn: () => getStudyTableProgress(table.id),
    })),
  });

  const isProgressLoading = progressQueries.some((query) => query.isLoading);
  const hasProgressError = progressQueries.some((query) => query.isError);
  const chartData = tables.flatMap((table, index) => {
    const progress = progressQueries[index]?.data;
    if (!progress) return [];
    return [
      {
        id: table.id,
        title: table.title,
        completed: progress.completed,
        remaining: Math.max(progress.total - progress.completed, 0),
      },
    ];
  });
  const completedSessions = chartData.reduce((t, i) => t + i.completed, 0);
  const remainingSessions = chartData.reduce((t, i) => t + i.remaining, 0);
  const totalSessions = completedSessions + remainingSessions;
  const completionPercent = totalSessions
    ? Math.round((completedSessions / totalSessions) * 100)
    : 0;
  return (
    <Card className="min-w-0 gap-4 p-5 sm:p-6">
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-extrabold">
              تقدم جداول المذاكرة
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              نسبة الجلسات المكتملة في أحدث جداولك
            </CardDescription>
          </div>
        </div>
        <Link
          href="/dashboard/tables"
          aria-label="عرض جميع جداول المذاكرة"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {tablesQuery.isLoading || isProgressLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        ) : tablesQuery.isError ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            تعذر تحميل جداول المذاكرة. حدّث الصفحة وحاول مرة أخرى.
          </p>
        ) : tables.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Table2 className="h-7 w-7" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              أنشئ أول جدول مذاكرة وسنعرض لك تقدمك هنا.
            </p>
          </div>
        ) : hasProgressError ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            تعذر تحميل تقدم بعض جداول المذاكرة.
          </p>
        ) : (
          <>
            <div className="h-64 min-w-0" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="title"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickFormatter={(title: string) =>
                      title.length > 10 ? `${title.slice(0, 10)}…` : title
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${value} جلسة`, name]}
                    labelFormatter={(label) => `الجدول: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="مكتمل"
                    stackId="sessions"
                    stroke="var(--study-progress-completed)"
                    fill="var(--study-progress-completed)"
                    fillOpacity={0.75}
                  />
                  <Area
                    type="monotone"
                    dataKey="remaining"
                    name="متبقي"
                    stackId="sessions"
                    stroke="var(--study-progress-remaining)"
                    fill="var(--study-progress-remaining)"
                    fillOpacity={0.35}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-3 text-center text-sm font-semibold text-foreground">
              {getEncouragement(completionPercent, totalSessions)}
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--study-progress-completed)" }}
                />
                مكتمل ({completedSessions})
              </span>
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--study-progress-remaining)" }}
                />
                متبقي ({remainingSessions})
              </span>
              <span>
                من {totalSessions} جلسة في أحدث {chartData.length} جداول
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}