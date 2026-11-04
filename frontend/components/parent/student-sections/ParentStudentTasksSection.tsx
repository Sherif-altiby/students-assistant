"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ListTodo, Repeat, Sun } from "lucide-react";
import {
  PARENT_TASK_FILTER_OPTIONS,
} from "@/constants";
import type { ParentOverview, ParentTaskFilter } from "@/types/parent";
import { EmptySection, SectionHeading } from "./SectionParts";
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicRelativeDate,
  isSameLocalDay,
} from "./formatters";

type Task = ParentOverview["tasks"][number];

/* ───────────── helpers ───────────── */

const isDaily = (t: Task) => t.frequency === "EVERY_DAY";

const lastDone = (t: Task) => t.histories[0]?.completedAt;

/* ───────────── small pieces ───────────── */

function TaskState({ task }: { task: Task }) {
  const last = lastDone(task);
  if (last && isSameLocalDay(last)) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        أُنجزت اليوم
      </span>
    );
  }
  // A daily task not done today needs attention; a one-day task simply isn't done yet.
  return isDaily(task) ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700">
      <Circle className="h-3.5 w-3.5" aria-hidden="true" />
      لم تُنجز اليوم
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <Circle className="h-3.5 w-3.5" aria-hidden="true" />
      غير منجزة
    </span>
  );
}

function FrequencyTag({ task }: { task: Task }) {
  const daily = isDaily(task);
  const Icon = daily ? Repeat : Sun;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      {daily ? "يومية" : "لليوم"}
    </span>
  );
}

/* ───────────── section ───────────── */

export function ParentStudentTasksSection({ overview }: { overview: ParentOverview }) {
  const [filter, setFilter] = useState<ParentTaskFilter>("all");
  const tasks = overview.tasks;

  const doneToday = (t: Task) =>
    Boolean(lastDone(t) && isSameLocalDay(lastDone(t)!));
  const counts = {
    all: tasks.length,
    daily: tasks.filter(isDaily).length,
    today: tasks.filter((t) => !isDaily(t)).length,
    pending: tasks.filter((t) => !doneToday(t)).length,
  };
  const totalCompletions = tasks.reduce((sum, t) => sum + t._count.histories, 0);
  const maxCompletions = Math.max(1, ...tasks.map((t) => t._count.histories));

  const visible = tasks.filter((t) =>
    filter === "all"
      ? true
      : filter === "daily"
        ? isDaily(t)
        : filter === "today"
          ? !isDaily(t)
          : !doneToday(t),
  );

  return (
    <section>
      <SectionHeading
        title="المهام"
        description="المهام المسجلة وعدد مرات إنجاز كل مهمة."
        icon={<ListTodo className="h-5 w-5" />}
        count={tasks.length}
      />

      {tasks.length === 0 ? (
        <EmptySection icon={<ListTodo className="h-5 w-5" />}>
          لا توجد مهام مسجلة.
        </EmptySection>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <dl className="grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-xl border border-border bg-card p-4">
            {[
              { label: "إجمالي المهام", value: tasks.length, tone: "text-foreground" },
              { label: "أُنجزت اليوم", value: tasks.length - counts.pending, tone: "text-emerald-600" },
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

          {/* Filter */}
          <div role="group" aria-label="تصفية المهام" className="flex flex-wrap gap-1.5">
            {PARENT_TASK_FILTER_OPTIONS.map((o) => {
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
              لا توجد مهام مطابقة لهذا الفلتر.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60 text-right text-xs font-semibold text-muted-foreground">
                    <th scope="col" className="px-4 py-3">المهمة</th>
                    <th scope="col" className="w-28 px-4 py-3">التكرار</th>
                    <th scope="col" className="w-44 px-4 py-3">عدد الإنجازات</th>
                    <th scope="col" className="w-44 px-4 py-3">آخر إنجاز</th>
                    <th scope="col" className="w-40 px-4 py-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((task) => {
                    const count = task._count.histories;
                    const last = lastDone(task);
                    return (
                      <tr
                        key={task.id}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <th scope="row" className="px-4 py-3 text-right font-semibold text-foreground">
                          {task.title}
                        </th>
                        <td className="px-4 py-3">
                          <FrequencyTag task={task} />
                        </td>
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
                          {last ? (
                            <>
                              <div className="text-foreground">{formatArabicRelativeDate(last)}</div>
                              <div className="text-[11px] tabular-nums text-muted-foreground">
                                {formatArabicDate(last)}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TaskState task={task} />
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