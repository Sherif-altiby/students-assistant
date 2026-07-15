"use client";

import { Pencil, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
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

  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4",
        !hasSubjects && "items-center justify-center text-center",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">
          {formatDayHeading(day.date)}
        </span>
        {hasSubjects && (
          <Button size="icon" variant="ghost" onClick={() => onEdit(day)} aria-label="تعديل اليوم">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!hasSubjects ? (
        <Button variant="outline" size="sm" onClick={() => onEdit(day)}>
          <Plus className="h-4 w-4" />
          إضافة مواد لهذا اليوم
        </Button>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {day.subjects.map((subject) => (
              <div key={subject.id} className="space-y-1">
                <p className="text-xs font-semibold text-primary">{subject.title}</p>
                {subject.chapters.map((chapter) => (
                  <div key={chapter.id} className="pr-2">
                    <p className="text-xs text-muted-foreground">{chapter.title}</p>
                    {chapter.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onToggle={onToggleLesson}
                        isToggling={isTogglingLesson}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-auto text-xs text-muted-foreground">
            {completedCount}/{allLessons.length} دروس منجزة
          </p>
        </>
      )}
    </Card>
  );
}