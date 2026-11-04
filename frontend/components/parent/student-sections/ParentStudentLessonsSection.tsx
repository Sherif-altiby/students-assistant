"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicRelativeDate,
  getSubjectColor,
} from "./formatters";
import type { ParentOverview } from "@/types/parent";
import { EmptySection, SectionHeading } from "./SectionParts";

type CompletedItem = ParentOverview["lessons"]["completed"][number];

/* ───────────── shared table shell ───────────── */

function SubHeading({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span aria-hidden="true" className="text-primary">
        {icon}
      </span>
      <h3 className="font-bold text-foreground">{title}</h3>
      <Badge variant="secondary" className="tabular-nums">
        {formatArabicNumber(count)}
      </Badge>
    </div>
  );
}

/* ───────────── completed ───────────── */

function CompletedTable({ completed }: { completed: CompletedItem[] }) {
  const [subject, setSubject] = useState<string>("all");

  const subjects = Array.from(new Set(completed.map((c) => c.lesson.unit.subject.title)));
  const countFor = (s: string) =>
    s === "all" ? completed.length : completed.filter((c) => c.lesson.unit.subject.title === s).length;
  const rows =
    subject === "all"
      ? completed
      : completed.filter((c) => c.lesson.unit.subject.title === subject);

  return (
    <div className="space-y-3">
      {subjects.length > 1 && (
        <div role="group" aria-label="تصفية حسب المادة" className="flex flex-wrap gap-1.5">
          {["all", ...subjects].map((s) => {
            const active = subject === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setSubject(s)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted")
                }
              >
                {s === "all" ? "الكل" : s}
                <span className="tabular-nums opacity-80">                {formatArabicNumber(countFor(s))}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-right text-xs font-semibold text-muted-foreground">
              <th scope="col" className="px-4 py-3">الدرس</th>
              <th scope="col" className="w-40 px-4 py-3">المادة</th>
              <th scope="col" className="px-4 py-3">الوحدة</th>
              <th scope="col" className="w-40 px-4 py-3">تاريخ الإكمال</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const title = item.lesson.unit.subject.title;
              return (
                <tr
                  key={item.id}
                  className="border-t border-border transition-colors hover:bg-muted/30"
                >
                  <th scope="row" className="px-4 py-3 text-right font-semibold text-foreground">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      {item.lesson.title}
                    </span>
                  </th>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: getSubjectColor(title) }}
                      />
                      {title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.lesson.unit.title}</td>
                  <td className="px-4 py-3">
                    <time dateTime={new Date(item.completedAt).toISOString()}>
                      <div className="text-foreground">{formatArabicRelativeDate(item.completedAt)}</div>
                      <div className="text-[11px] tabular-nums text-muted-foreground">
                        {formatArabicDate(item.completedAt)}
                      </div>
                    </time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────── section ───────────── */

export function ParentStudentLessonsSection({ overview }: { overview: ParentOverview }) {
  const { completed } = overview.lessons;

  return (
    <section>
      <SectionHeading
        title="الدروس"
        description="سجل الدروس المكتملة."
        icon={<BookOpen className="h-5 w-5" />}
      />

      <div className="space-y-8">
        <div>
          <SubHeading
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="الدروس المكتملة (الأحدث)"
            count={completed.length}
          />
          {completed.length === 0 ? (
            <EmptySection icon={<CheckCircle2 className="h-5 w-5" />}>
              لا توجد دروس مكتملة.
            </EmptySection>
          ) : (
            <CompletedTable completed={completed} />
          )}
        </div>
      </div>
    </section>
  );
}