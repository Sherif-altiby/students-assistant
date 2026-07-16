"use client";

import { Pencil, Plus, CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonRow } from "./LessonRow";
import { cn } from "@/lib/utils";
import type { StudyTableDayDetailed } from "@/types/study-table";
import { formatDayHeading } from "@/data/date";

interface DayCellProps {
  day: StudyTableDayDetailed;
  onEdit: (day: StudyTableDayDetailed) => void;
  onToggleLesson: (lessonId: string) => void;
  isTogglingLesson: boolean;
}

export function DayCell({ day, onEdit, onToggleLesson, isTogglingLesson }: DayCellProps) {
  const hasSubjects = day.subjects.length > 0;
  const allLessons = day.subjects.flatMap((s) => s.chapters.flatMap((c) => c.lessons));
  const completedCount = allLessons.filter((l) => l.completions.length > 0).length;
  const total = allLessons.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = total > 0 && completedCount === total;

  return (
    <Card
      className={cn(
        "group flex flex-col gap-3 p-4 transition-shadow hover:shadow-md",
        !hasSubjects &&
          "items-center justify-center gap-3 border-dashed text-center bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatDayHeading(day.date)}
          </span>
          {isComplete && (
            <CircleCheck className="h-4 w-4 text-emerald-500" aria-label="اليوم مكتمل" />
          )}
        </div>
        {hasSubjects && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => onEdit(day)}
            aria-label="تعديل اليوم"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {!hasSubjects ? (
        <>
          <p className="text-xs text-muted-foreground">لا توجد مواد مجدولة</p>
          <Button variant="outline" size="sm" onClick={() => onEdit(day)}>
            <Plus className="h-4 w-4" />
            إضافة مواد لهذا اليوم
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {day.subjects.map((subject) => (
              <div key={subject.id} className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {subject.title}
                </p>
                {subject.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="border-r-2 border-border/60 pr-2.5"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      {chapter.title}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {chapter.lessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          onToggle={onToggleLesson}
                          isToggling={isTogglingLesson}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-1.5 pt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isComplete ? "bg-emerald-500" : "bg-primary",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{total} دروس منجزة
            </p>
          </div>
        </>
      )}
    </Card>
  );
}