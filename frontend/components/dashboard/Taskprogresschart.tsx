"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { TaskProgressPeriod } from "@/lib/tasks";
import { useTaskProgress } from "@/hooks/Usetasks";
import {
  Calendar,
  TrendingUp,
  Award,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatChip } from "@/components/dashboard/home/home-page-components";

const FILTERS: {
  value: TaskProgressPeriod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "day", label: "يوم", icon: <Calendar className="h-3.5 w-3.5" /> },
  { value: "week", label: "أسبوع", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: "month", label: "شهر", icon: <Award className="h-3.5 w-3.5" /> },
];

const PERIOD_NOUN: Record<TaskProgressPeriod, string> = {
  day: "يوم",
  week: "أسبوع",
  month: "شهر",
};

// "2026-07-19" -> "19 يوليو" | "2026-07" -> "يوليو 2026"
function formatPeriodLabel(period: string, filter: TaskProgressPeriod): string {
  if (filter === "month") {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  }

  const date = new Date(`${period}T00:00:00Z`);
  return date.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const { completed, total, completionRate } = row;

  return (
    <div className="min-w-[170px] rounded-xl border border-border bg-popover p-3.5">
      <p className="mb-2 text-sm font-bold text-popover-foreground">{label}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            أنجزت
          </span>
          <span className="font-bold tabular-nums text-popover-foreground">
            {completed}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full opacity-40"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            الإجمالي
          </span>
          <span className="font-bold tabular-nums text-popover-foreground">
            {total}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <span className="text-muted-foreground">نسبة الإنجاز</span>
          <span className="font-extrabold tabular-nums text-primary">
            {completionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};

const ScrollbarStyles = () => (
  <style>{`
    .task-progress-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .task-progress-scroll::-webkit-scrollbar { height: 6px; }
    .task-progress-scroll::-webkit-scrollbar-track { background: transparent; }
    .task-progress-scroll::-webkit-scrollbar-thumb {
      background-color: var(--border);
      border-radius: 9999px;
    }
    .task-progress-scroll::-webkit-scrollbar-thumb:hover {
      background-color: var(--muted-foreground);
    }
  `}</style>
);

export default function TaskProgressChart() {
  const [filter, setFilter] = useState<TaskProgressPeriod>("day");
  const { points, isLoading, isError, isFetching } = useTaskProgress(filter);

  const chartData = useMemo(
    () =>
      points.map((point) => {
        // total should never be lower than completed; guard against
        // inconsistent data from the API
        const total = Math.max(point.total, point.completed);
        const remaining = Math.max(total - point.completed, 0);

        return {
          ...point,
          total,
          remaining,
          label: formatPeriodLabel(point.period, filter),
        };
      }),
    [points, filter],
  );

  const { totalCompleted, totalTasks, rate, average, best } = useMemo(() => {
    const completed = chartData.reduce((sum, p) => sum + p.completed, 0);
    const total = chartData.reduce((sum, p) => sum + p.total, 0);
    return {
      totalCompleted: completed,
      totalTasks: total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      average:
        chartData.length > 0 ? Math.round(completed / chartData.length) : 0,
      best:
        chartData.length > 0 ? Math.max(...chartData.map((p) => p.completed)) : 0,
    };
  }, [chartData]);

  const noun = PERIOD_NOUN[filter];

  return (
    <Card className="gap-0 border border-border  p-5   sm:p-6">
      <ScrollbarStyles />

      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-card-foreground">
              تقدم المهام
            </h2>
            <p className="text-xs text-muted-foreground">
              {chartData.length > 0
                ? `أنجزت ${totalCompleted} من ${totalTasks} مهمة`
                : "تابع إنجازك يومًا بيوم"}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div
          role="group"
          aria-label="فلترة التقدم"
          className="inline-flex self-start rounded-full border border-border bg-muted p-1 sm:self-auto"
        >
          {FILTERS.map(({ value, label, icon }) => {
            const active = value === filter;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Quick stats */}
      {!isLoading && !isError && chartData.length > 0 && (
        <div className="mb-5 flex gap-2.5">
          <StatChip label="نسبة الإنجاز" value={rate} suffix="%" tone="primary" />
          <StatChip label={`أفضل ${noun}`} value={best} suffix="مهمة" />
          <StatChip label={`المتوسط لكل ${noun}`} value={average} suffix="مهمة" />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>جارٍ تحميل تقدمك…</p>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="font-semibold text-destructive">تعذر تحميل تقدمك</p>
          <p className="text-xs text-muted-foreground">
            تأكد من اتصالك بالإنترنت ثم حدّث الصفحة
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && chartData.length === 0 && (
        <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-card-foreground">
              لم تنجز أي مهمة بعد
            </p>
            <p className="text-sm text-muted-foreground">
              أنجز أول مهمة وسيظهر تقدمك هنا ✅
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isError && chartData.length > 0 && (
        <div
          className={cn(
            "flex h-72 flex-col transition-opacity duration-300",
            isFetching ? "opacity-60" : "opacity-100",
          )}
        >
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-card to-transparent" />

            <div className="task-progress-scroll h-full overflow-x-auto overflow-y-hidden pb-2">
              <div
                className="h-full"
                style={{
                  minWidth: "100%",
                  width: Math.max(chartData.length * 64, 100),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                    barGap={0}
                    barSize={36}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--border)"
                      vertical={false}
                      opacity={0.6}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-4}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    />

                    <Bar
                      dataKey="completed"
                      stackId="tasks"
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`completed-${index}`}
                          fill="var(--chart-1)"
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Bar>

                    <Bar
                      dataKey="remaining"
                      stackId="tasks"
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`remaining-${index}`}
                          fill="var(--chart-2)"
                          fillOpacity={0.35}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fixed legend */}
          <div className="flex shrink-0 items-center justify-center gap-5 pt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "var(--chart-1)" }}
              />
              <span className="font-medium text-muted-foreground">أنجزتها</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full opacity-40"
                style={{ backgroundColor: "var(--chart-2)" }}
              />
              <span className="font-medium text-muted-foreground">المتبقية</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}