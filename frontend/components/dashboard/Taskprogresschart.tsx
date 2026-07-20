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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FILTERS: {
  value: TaskProgressPeriod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "day", label: "يوم", icon: <Calendar className="w-3 h-3" /> },
  { value: "week", label: "أسبوع", icon: <TrendingUp className="w-3 h-3" /> },
  { value: "month", label: "شهر", icon: <Award className="w-3 h-3" /> },
];

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

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const { completed, total, completionRate } = row;

  return (
    <div className="rounded-xl border border-border bg-popover p-4 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-popover-foreground">
        {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            المهام المنجزة
          </span>
          <span className="font-medium text-popover-foreground">
            {completed}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            إجمالي المهام
          </span>
          <span className="font-medium text-popover-foreground">{total}</span>
        </div>
        <div className="mt-1.5 border-t border-border pt-1.5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">نسبة الإنجاز</span>
            <span className="font-bold text-primary">{completionRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Thin, rounded, theme-aware scrollbar for the horizontally scrollable chart
const ScrollbarStyles = () => (
  <style>{`
    .task-progress-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .task-progress-scroll::-webkit-scrollbar {
      height: 6px;
    }
    .task-progress-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
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
        // inconsistent data from the API (e.g. total: 0 while completed: 1)
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

  const totalCompleted = useMemo(
    () => chartData.reduce((sum, p) => sum + p.completed, 0),
    [chartData],
  );

  const totalTasks = useMemo(
    () => chartData.reduce((sum, p) => sum + p.total, 0),
    [chartData],
  );

  const overallCompletionRate = useMemo(
    () =>
      totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
    [totalTasks, totalCompleted],
  );

  const averagePerDay = useMemo(
    () =>
      chartData.length > 0
        ? Math.round(totalCompleted / chartData.length)
        : 0,
    [chartData, totalCompleted],
  );

  const bestDay = useMemo(
    () =>
      chartData.length > 0
        ? Math.max(...chartData.map((p) => p.completed))
        : 0,
    [chartData],
  );

  return (
    <Card className="border border-border bg-card p-6 shadow-sm">
      <ScrollbarStyles />
      <div>
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-card-foreground">
              تقدم المهام
            </h2>
            {chartData.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalCompleted} من {totalTasks} مهمة ({overallCompletionRate}%)
              </p>
            )}
          </div>

          {/* Filter Buttons */}
          <div
            role="group"
            aria-label="فلترة التقدم"
            className="inline-flex rounded-lg border border-border bg-muted p-1"
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
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {icon}
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>جارٍ تحميل تقدمك…</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-destructive">تعذر تحميل تقدمك</p>
            <p className="text-xs text-muted-foreground">
              يرجى المحاولة مرة أخرى
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-card-foreground">
                لا توجد مهام منجزة بعد
              </p>
              <p className="text-sm text-muted-foreground">
                أنجز مهمة وستظهر هنا 📝
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
            {/* Scrollable area: axis, grid, and bars only */}
            <div className="relative min-h-0 flex-1">
              {/* Edge fades hinting there's more to scroll */}
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
                        cursor={{ fill: "var(--muted)" }}
                      />

                      <Bar
                        dataKey="completed"
                        stackId="completed"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`completed-${index}`}
                            fill="var(--chart-1)"
                            className="transition-opacity hover:opacity-80"
                          />
                        ))}
                      </Bar>

                      <Bar
                        dataKey="remaining"
                        stackId="completed"
                        fill="var(--chart-2)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`remaining-${index}`}
                            fill="var(--chart-2)"
                            className="transition-opacity hover:opacity-80"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Fixed legend: stays in place, never scrolls horizontally */}
            <div className="flex shrink-0 items-center justify-center gap-4 pt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--chart-1)" }}
                />
                <span className="text-muted-foreground">منجزة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--chart-2)" }}
                />
                <span className="text-muted-foreground">متبقية</span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Footer */}
      </div>
    </Card>
  );
}