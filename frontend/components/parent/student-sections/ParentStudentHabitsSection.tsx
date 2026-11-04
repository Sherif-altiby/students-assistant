"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Flame, Repeat2 } from "lucide-react";
import { PARENT_HABIT_FILTER_OPTIONS } from "@/constants";
import type { ParentHabitFilter, ParentOverview } from "@/types/parent";
import { EmptySection, SectionHeading } from "./SectionParts";
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicRelativeDate,
  getLocalDayDifference,
  isSameLocalDay,
} from "./formatters";

type Habit = ParentOverview["habits"][number];

/* ───────────── helpers ───────────── */

const lastDone = (h: Habit) => h.completions[0]?.completedAt;

const doneToday = (h: Habit) => {
  const last = lastDone(h);
  return Boolean(last) && isSameLocalDay(last!);
};

/** Consecutive days with a completion, ending today or yesterday (from the loaded completions). */
function currentStreak(h: Habit) {
  const days = Array.from(new Set(h.completions.map((c) => getLocalDayDifference(c.completedAt)))).sort(
    (a, b) => a - b,
  );
  if (days.length === 0 || days[0] > 1) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) streak++;
    else break;
  }
  return streak;
}

/* ───────────── pieces ───────────── */

function HabitState({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      أُنجزت اليوم
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
      <Circle className="h-3.5 w-3.5" aria-hidden="true" />
      لم تُنجز اليوم
    </span>
  );
}

/* ───────────── section ───────────── */

export function ParentStudentHabitsSection({ overview }: { overview: ParentOverview }) {
  const [filter, setFilter] = useState<ParentHabitFilter>("all");
  const habits = overview.habits;

  const doneCount = habits.filter(doneToday).length;
  const counts: Record<ParentHabitFilter, number> = {
    all: habits.length,
    done: doneCount,
    pending: habits.length - doneCount,
  };
  const totalCompletions = habits.reduce((s, h) => s + h._count.completions, 0);
  const maxCompletions = Math.max(1, ...habits.map((h) => h._count.completions));

  const visible = habits.filter((h) =>
    filter === "all" ? true : filter === "done" ? doneToday(h) : !doneToday(h),
  );

  const todayPercent = habits.length === 0 ? 0 : Math.round((doneCount / habits.length) * 100);

  return (
    <section>
      <SectionHeading
        title="العادات"
        description="العادات اليومية ومؤشر إنجازاتها."
        icon={<Repeat2 className="h-5 w-5" />}
        count={habits.length}
      />

      {habits.length === 0 ? (
        <EmptySection icon={<Repeat2 className="h-5 w-5" />}>
          لا توجد عادات مسجلة.
        </EmptySection>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">إنجاز اليوم</p>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {formatArabicNumber(todayPercent)}٪
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={todayPercent}
              aria-label="إنجاز العادات اليوم"
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={
                  "h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none " +
                  (todayPercent === 100 ? "bg-emerald-500" : "bg-primary")
                }
                style={{ width: `${todayPercent}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-3 divide-x divide-x-reverse divide-border">
              {[
                { label: "إجمالي العادات", value: habits.length, tone: "text-foreground" },
                { label: "أُنجزت اليوم", value: doneCount, tone: "text-emerald-600" },
                { label: "إجمالي الإنجازات", value: totalCompletions, tone: "text-foreground" },
              ].map((s) => (
                <div key={s.label} className="px-3 first:pr-0 last:pl-0">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className={"mt-1 text-lg font-bold tabular-nums " + s.tone}>
                    {formatArabicNumber(s.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Filter */}
          <div role="group" aria-label="تصفية العادات" className="flex flex-wrap gap-1.5">
            {PARENT_HABIT_FILTER_OPTIONS.map((o) => {
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

          {/* Table */}
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              لا توجد عادات مطابقة لهذا الفلتر.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[38rem] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60 text-right text-xs font-semibold text-muted-foreground">
                    <th scope="col" className="px-4 py-3">العادة</th>
                    <th scope="col" className="w-44 px-4 py-3">عدد الإنجازات</th>
                    <th scope="col" className="w-28 px-4 py-3">التتابع</th>
                    <th scope="col" className="w-44 px-4 py-3">آخر إنجاز</th>
                    <th scope="col" className="w-40 px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((habit) => {
                    const count = habit._count.completions;
                    const last = lastDone(habit);
                    const streak = currentStreak(habit);
                    return (
                      <tr
                        key={habit.id}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <th scope="row" className="px-4 py-3 text-right font-semibold text-foreground">
                          {habit.title}
                        </th>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 shrink-0 text-sm font-semibold tabular-nums text-foreground">
                              {formatArabicNumber(count)}
                            </span>
                            <div
                              aria-hidden="true"
                              className="h-1.5 w-full max-w-24 overflow-hidden rounded-full bg-muted"
                            >
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${(count / maxCompletions) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {streak >= 2 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-amber-600">
                              <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatArabicNumber(streak)} أيام
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {last ? (
                            <>
                              <div className="text-foreground">{formatArabicRelativeDate(last)}</div>
                              <div className="text-[11px] tabular-nums text-muted-foreground">
                                {formatArabicDate(last)}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">لم تُنجز بعد</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <HabitState done={doneToday(habit)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}