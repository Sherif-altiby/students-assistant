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
import {
  Calendar,
  TrendingUp,
  Award,
  Loader2,
  AlertTriangle,
  Repeat,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatChip } from "@/components/dashboard/home/home-page-components";

const FILTERS: {
  value: HabitProgressPeriod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "day", label: "يوم", icon: <Calendar className="h-3.5 w-3.5" /> },
  { value: "week", label: "أسبوع", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  { value: "month", label: "شهر", icon: <Award className="h-3.5 w-3.5" /> },
];

const PERIOD_NOUN: Record<HabitProgressPeriod, string> = {
  day: "يوم",
  week: "أسبوع",
  month: "شهر",
};

// Each tier is a share of the student's own best period, so the chart
// motivates by comparing you with your best self, not with other people.
const TIERS = [
  { min: 0.8, color: "var(--chart-2)", legend: "ممتاز", message: "أداء ممتاز، استمر! 🔥" },
  { min: 0.5, color: "var(--chart-1)", legend: "جيد", message: "أداء جيد، أنت على الطريق 👏" },
  { min: 0.3, color: "var(--chart-4)", legend: "يتحسن", message: "بداية طيبة، زد خطوة 💪" },
  { min: 0, color: "var(--chart-5)", legend: "ابدأ من جديد", message: "كل يوم فرصة جديدة 🌱" },
] as const;

function getTier(ratio: number) {
  return TIERS.find((t) => ratio >= t.min) ?? TIERS[TIERS.length - 1];
}

const getBarColor = (value: number, max: number) =>
  getTier(max > 0 ? value / max : 0).color;

// "2026-07-19" -> "19 يوليو" | "2026-07" -> "يوليو 2026"
function formatPeriodLabel(period: string, filter: HabitProgressPeriod): string {
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

const CustomTooltip = ({ active, payload, label, maxValue, noun }: any) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload;
  if (!row) return null;

  const { completedCount } = row;
  const ratio = maxValue > 0 ? completedCount / maxValue : 0;
  const isBest = maxValue > 0 && completedCount === maxValue;
  const tier = getTier(ratio);

  return (
    <div className="min-w-[190px] rounded-xl border border-border bg-popover p-3.5 shadow-lg">
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-popover-foreground">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: tier.color }}
        />
        {label}
      </p>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">عادات أنجزتها</span>
          <span className="font-extrabold tabular-nums text-popover-foreground">
            {completedCount}
          </span>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: tier.color,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-1.5">
          <span className="text-muted-foreground">مقارنة بأفضل {noun}</span>
          <span className="font-bold tabular-nums text-popover-foreground">
            {Math.round(ratio * 100)}%
          </span>
        </div>

        <p className="pt-0.5 text-xs font-semibold" style={{ color: tier.color }}>
          {isBest ? `أفضل ${noun} لك 🏆` : tier.message}
        </p>
      </div>
    </div>
  );
};

const ScrollbarStyles = () => (
  <style>{`
    .habit-progress-scroll {
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .habit-progress-scroll::-webkit-scrollbar { height: 6px; }
    .habit-progress-scroll::-webkit-scrollbar-track { background: transparent; }
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
      })),
    [points, filter],
  );

  const { totalCompleted, maxValue, average } = useMemo(() => {
    const total = chartData.reduce((sum, p) => sum + p.completedCount, 0);
    return {
      totalCompleted: total,
      maxValue:
        chartData.length > 0
          ? Math.max(...chartData.map((p) => p.completedCount))
          : 0,
      average: chartData.length > 0 ? Math.round(total / chartData.length) : 0,
    };
  }, [chartData]);

  const noun = PERIOD_NOUN[filter];

  return (
    <Card className="gap-0 border border-border bg-card p-5 shadow-sm sm:p-6">
      <ScrollbarStyles />

      {/* Header */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-card-foreground">
              تقدم العادات
            </h2>
            <p className="text-xs text-muted-foreground">
              الاستمرار أهم من الكمال
            </p>
          </div>
        </div>

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
                    ? "bg-primary text-primary-foreground shadow-sm"
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
          <StatChip label="إجمالي المنجز" value={totalCompleted} tone="primary" />
          <StatChip label={`أفضل ${noun}`} value={maxValue} />
          <StatChip label={`المتوسط لكل ${noun}`} value={average} />
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
          <div className="rounded-full bg-amber-500/10 p-4">
            <Repeat className="h-8 w-8 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-card-foreground">
              لم تنجز أي عادة بعد
            </p>
            <p className="text-sm text-muted-foreground">
              أنجز عادة اليوم وستبدأ سلسلتك هنا 🔥
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
                      content={<CustomTooltip maxValue={maxValue} noun={noun} />}
                      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    />
                    <Bar
                      dataKey="completedCount"
                      radius={[8, 8, 0, 0]}
                      animationDuration={800}
                      animationEasing="ease-in-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(entry.completedCount, maxValue)}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fixed legend: what each bar colour means */}
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-3 text-xs">
            {TIERS.map((tier) => (
              <div key={tier.legend} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tier.color }}
                />
                <span className="font-medium text-muted-foreground">
                  {tier.legend}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}