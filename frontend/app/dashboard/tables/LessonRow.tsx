// components/study-table/LessonRow.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DayLesson } from "@/types/study-table";

interface LessonRowProps {
  lesson: DayLesson;
  onToggle: (lessonId: string) => void;
  isToggling: boolean;
}

export function LessonRow({ lesson, onToggle, isToggling }: LessonRowProps) {
  const isCompleted = lesson.completions.length > 0;

  return (
    <label className="flex items-center gap-2 py-1 text-sm">
      <Checkbox
        checked={isCompleted}
        disabled={isCompleted || isToggling}
        onCheckedChange={() => !isCompleted && onToggle(lesson.id)}
      />
      <span className={cn(isCompleted && "text-muted-foreground line-through")}>
        {lesson.title}
      </span>
    </label>
  );
}