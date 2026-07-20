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
import { useHabitProgress } from "@/hooks/useHabits";
import type { HabitProgressPeriod } from "@/lib/habits";
import { Calendar, TrendingUp, Award, Loader2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FILTERS: { value: HabitProgressPeriod; label: string; icon: React.ReactNode }[] = [
  { value: "day", label: "يوم", icon: <Calendar className="w-3 h-3" /> },
  { value: "week", label: "أسبوع", icon: <TrendingUp className="w-3 h-3" /> },
  { value: "month", label: "شهر", icon: <Award className="w-3 h-3" /> },
];

// "2026-07-19" -> "19 يوليو" | "2026-07" -> "يوليو 2026"
function formatPeriodLabel(
  period: string,
  filter: HabitProgressPeriod,
): string {
  if (filter === "month") {
    const [year, month] = period.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("ar-EG", {
      month: "long",
      year: "numeric",
    });
  }

  const date = new Date(`${period}T00:00:00Z`);
  return date.toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Map a value's share of the max onto the theme's chart palette (no gradients).
const getBarColor = (value: number, max: number) => {
  const ratio = max > 0 ? value / max : 0;
  if (ratio >= 0.8) return "var(--chart-2)";
  if (ratio >= 0.5) return "var(--chart-1)";
  if (ratio >= 0.3) return "var(--chart-4)";
  return "var(--chart-5)";
};

// A short, human read on how a day/week/month stacks up against the best one.
const getPerformanceLabel = (ratio: number) => {
  if (ratio >= 0.99) return "أفضل أداء 🏆";
  if (ratio >= 0.8) return "أداء ممتاز";
  if (ratio >= 0.5) return "أداء جيد";
  if (ratio >= 0.3) return "أداء متوسط";
  return "أداء ضعيف";
};

// Custom tooltip: shows the count, its share of the best period, and a
// color dot matching the bar so the tooltip reads consistently with the chart.
const CustomTooltip = ({ active, payload, label, maxValue }: any) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const { completedCount } = row;
  const ratio = maxValue > 0 ? completedCount / maxValue : 0;
  const color = getBarColor(completedCount, maxValue || 1);

  return (
    <div className="min-w-[180px] rounded-xl border border-border bg-popover p-4 shadow-lg">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-popover-foreground">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">عادات منجزة</span>
          <span className="font-bold text-popover-foreground">
            {completedCount}
          </span>
        </div>

        {/* Mini progress bar relative to the best period */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: color,
            }}
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5 text-xs">
          <span className="text-muted-foreground">مقارنة بأفضل يوم</span>
          <span className="font-medium text-popover-foreground">
            {Math.round(ratio * 100)}%
          </span>
        </div>

        <p className="pt-0.5 text-xs font-medium" style={{ color }}>
          {getPerformanceLabel(ratio)}
        </p>
      </div>
    </div>
  );
};

// Thin, rounded, theme-aware scrollbar for the horizontally scrollable chart
const ScrollbarStyles = () => (
  <style>{`
    .habit-progress-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .habit-progress-scroll::-webkit-scrollbar {
      height: 6px;
    }
    .habit-progress-scroll::-webkit-scrollbar-track {
      background: transparent;
    }
    .habit-progress-scroll::-webkit-scrollbar-thumb {
      background-color: var(--border);
      border-radius: 9999px;
    }
    .habit-progress-scroll::-webkit-scrollbar-thumb:hover {
      background-color: var(--muted-foreground);
    }
  `}</style>
);

export default function HabitProgressChart() {
  const [filter, setFilter] = useState<HabitProgressPeriod>("day");
  const { points, isLoading, isError, isFetching } = useHabitProgress(filter);

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        label: formatPeriodLabel(point.period, filter),
        percentage:
          points.length > 0
            ? (point.completedCount / Math.max(...points.map((p) => p.completedCount))) * 100
            : 0,
      })),
    [points, filter],
  );

  const totalCompleted = useMemo(
    () => chartData.reduce((sum, p) => sum + p.completedCount, 0),
    [chartData],
  );

  const maxValue = useMemo(
    () => Math.max(...chartData.map((p) => p.completedCount), 0),
    [chartData],
  );

  const averageCompletion = useMemo(
    () => (chartData.length > 0 ? Math.round(totalCompleted / chartData.length) : 0),
    [chartData, totalCompleted],
  );

  const bestDay = useMemo(
    () => (chartData.length > 0 ? Math.max(...chartData.map((p) => p.completedCount)) : 0),
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
              تقدم العادات
            </h2>
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
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
            <p className="text-xs text-muted-foreground">يرجى المحاولة مرة أخرى</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-card-foreground">لا توجد عادات منجزة بعد</p>
              <p className="text-sm text-muted-foreground">
                أنجز عادة وستظهر هنا 📝
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !isError && chartData.length > 0 && (
          <div
            className={cn(
              "relative h-72 transition-opacity duration-300",
              isFetching ? "opacity-60" : "opacity-100"
            )}
          >
            {/* Edge fades hinting there's more to scroll */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-card to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-card to-transparent" />

            <div className="habit-progress-scroll h-full overflow-x-auto overflow-y-hidden pb-2">
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
                      content={<CustomTooltip maxValue={maxValue} />}
                      cursor={{ fill: "var(--muted)", radius: 4 }}
                    />
                    <Bar
                      dataKey="completedCount"
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(entry.completedCount, maxValue || 1)}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}