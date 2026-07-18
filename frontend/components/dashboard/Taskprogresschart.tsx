"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import type { TaskProgressPeriod } from "@/lib/tasks";
import { useTaskProgress } from "@/hooks/Usetasks";
import { Calendar, TrendingUp, Award, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FILTERS: { value: TaskProgressPeriod; label: string; icon: React.ReactNode }[] = [
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
  return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric", timeZone: "UTC" });
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;

  const dailyTasks = payload.find((p: any) => p.dataKey === "todayCompleted")?.value || 0;
  const everydayTasks = payload.find((p: any) => p.dataKey === "everyDayCompleted")?.value || 0;
  const total = dailyTasks + everydayTasks;

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            مهام يومية
          </span>
          <span className="font-medium text-white">{everydayTasks}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
            مهام اليوم
          </span>
          <span className="font-medium text-white">{dailyTasks}</span>
        </div>
        <div className="mt-1.5 border-t border-slate-700/50 pt-1.5">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">الإجمالي</span>
            <span className="font-bold text-emerald-400">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom legend
const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;

  return (
    <div className="flex items-center justify-center gap-4 text-xs">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <span 
            className="inline-block h-2.5 w-2.5 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">
            {entry.value === "everyDayCompleted" ? "مهام يومية" : "مهام اليوم"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TaskProgressChart() {
  const [filter, setFilter] = useState<TaskProgressPeriod>("day");
  const { points, isLoading, isError, isFetching } = useTaskProgress(filter);

  const chartData = useMemo(
    () => points.map((point) => ({
      ...point,
      label: formatPeriodLabel(point.period, filter),
      total: point.everyDayCompleted + point.todayCompleted,
    })),
    [points, filter],
  );

  const totalCompleted = useMemo(
    () => chartData.reduce((sum, p) => sum + p.everyDayCompleted + p.todayCompleted, 0),
    [chartData],
  );

  const dailyTasksTotal = useMemo(
    () => chartData.reduce((sum, p) => sum + p.todayCompleted, 0),
    [chartData],
  );

  const everydayTasksTotal = useMemo(
    () => chartData.reduce((sum, p) => sum + p.everyDayCompleted, 0),
    [chartData],
  );

  const averagePerDay = useMemo(
    () => chartData.length > 0 ? Math.round(totalCompleted / chartData.length) : 0,
    [chartData, totalCompleted],
  );

  const bestDay = useMemo(
    () => chartData.length > 0 ? Math.max(...chartData.map(p => p.total)) : 0,
    [chartData],
  );

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl">
      {/* Decorative gradient blurs */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">
              تقدم المهام
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-emerald-400">
                ✅ {totalCompleted} مهمة منجزة
              </span>
              <span className="text-blue-400">
                📊 {averagePerDay} / يوم
              </span>
              <span className="text-purple-400">
                ⭐ أفضل يوم {bestDay}
              </span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div
            role="group"
            aria-label="فلترة التقدم"
            className="inline-flex rounded-lg border border-slate-700/50 bg-slate-800/50 p-1 backdrop-blur-sm"
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
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400",
                    active
                      ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
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
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <p>جارٍ تحميل تقدمك…</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm">
            <div className="rounded-full bg-red-500/10 p-3">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400">تعذر تحميل تقدمك</p>
            <p className="text-xs text-slate-500">يرجى المحاولة مرة أخرى</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-slate-800/50 p-4">
              <CheckCircle2 className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-300">لا توجد مهام منجزة بعد</p>
              <p className="text-sm text-slate-500">
                أنجز مهمة وستظهر هنا 📝
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !isError && chartData.length > 0 && (
          <div
            className={cn(
              "h-72 transition-all duration-300",
              isFetching ? "opacity-60" : "opacity-100"
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                barGap={0}
                barSize={Math.min(40, 600 / chartData.length)}
              >
                <defs>
                  <linearGradient id="everydayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="todayGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#1e293b"
                  vertical={false}
                  opacity={0.5}
                />

                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.05)" }} />

                <Legend
                  content={<CustomLegend />}
                  wrapperStyle={{ paddingTop: 12 }}
                />

                <Bar
                  dataKey="everyDayCompleted"
                  stackId="completed"
                  fill="url(#everydayGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`everyday-${index}`}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>

                <Bar
                  dataKey="todayCompleted"
                  stackId="completed"
                  fill="url(#todayGradient)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`today-${index}`}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats Footer */}
        {!isLoading && !isError && chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-slate-700/50 pt-4">
            <div className="text-center">
              <p className="text-[10px] text-slate-400">الإجمالي</p>
              <p className="text-sm font-bold text-white">{totalCompleted}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400">المتوسط</p>
              <p className="text-sm font-bold text-emerald-400">{averagePerDay}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400">مهام يومية</p>
              <p className="text-sm font-bold text-emerald-400">{everydayTasksTotal}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400">مهام اليوم</p>
              <p className="text-sm font-bold text-blue-400">{dailyTasksTotal}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}