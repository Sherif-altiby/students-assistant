"use client";

import {
  Pencil,
  Plus,
  CircleCheck,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonRow } from "./LessonRow";
import { cn } from "@/lib/utils";
import type { StudyTableDayDetailed } from "@/types/study-table";
import { formatDayHeading } from "@/data/date";
import { useState } from "react";

interface DayCellProps {
  day: StudyTableDayDetailed;
  onEdit: (day: StudyTableDayDetailed) => void;
  onToggleLesson: (lessonId: string) => void;
  isTogglingLesson: boolean;
}

export function DayCell({
  day,
  onEdit,
  onToggleLesson,
  isTogglingLesson,
}: DayCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubjects = day.subjects.length > 0;
  const allLessons = day.subjects.flatMap((s) =>
    s.chapters.flatMap((c) => c.lessons),
  );
  const completedCount = allLessons.filter(
    (l) => l.completions.length > 0,
  ).length;
  const total = allLessons.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = total > 0 && completedCount === total;

  const totalSubjects = day.subjects.length;
  const totalChapters = day.subjects.reduce(
    (acc, s) => acc + s.chapters.length,
    0,
  );

  // Determine status color
  const getStatusColor = () => {
    if (isComplete) return "text-emerald-500";
    if (progress > 50) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        !hasSubjects
          ? "border-dashed bg-muted/10 hover:bg-muted/20"
          : "border-border/50 hover:border-primary/20",
        isComplete && "border-emerald-500/30 bg-emerald-50/10",
      )}
    >
      {/* Status bar - subtle indicator at top */}
      {hasSubjects && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isComplete ? "bg-emerald-500" : "bg-primary/60",
            )}
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      )}

      <div className="p-5 pt-4">
        {/* Header - Enhanced */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                hasSubjects
                  ? "bg-primary/10 text-primary group-hover:bg-primary/15"
                  : "bg-muted/30 text-muted-foreground",
              )}
            >
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground truncate">
                  {formatDayHeading(day.date)}
                </span>
                {isComplete && (
                  <CircleCheck
                    className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0"
                    aria-label="اليوم مكتمل"
                  />
                )}
              </div>
              {hasSubjects && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {totalSubjects} {totalSubjects === 1 ? "مادة" : "مواد"}
                  </span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">
                    {totalChapters} {totalChapters === 1 ? "فصل" : "فصول"}
                  </span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">
                    {total} {total === 1 ? "درس" : "دروس"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasSubjects && (
              <>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2.5 py-0.5 border-0",
                    isComplete
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-primary/5 text-primary",
                  )}
                >
                  {progress}%
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-primary/10"
                  onClick={() => onEdit(day)}
                  aria-label="تعديل اليوم"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-muted"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "طي" : "توسيع"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content - Empty State or Lessons */}
        {!hasSubjects ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            {/* Animated icon container */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
              <div className="relative rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-4 transition-transform duration-300 hover:scale-110">
                <BookOpen className="h-6 w-6 text-primary/70" />
              </div>
            </div>

            {/* Content with better typography */}
            <div className="space-y-2 max-w-xs">
              <p className="text-base font-semibold text-foreground">
                لا توجد مواد مجدولة
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                أضف مواد ودروس لهذا اليوم لتتبع تقدمك وتحقيق أهدافك الدراسية
              </p>
            </div>

            {/* Action buttons with better styling */}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                size="default"
                onClick={() => onEdit(day)}
                className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm hover:shadow transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                إضافة مواد للدراسة
              </Button>
            </div>

            {/* Optional: Quick tip */}
            <p className="text-xs text-muted-foreground/60 mt-1">
              💡 يمكنك اختيار الدروس من المواد المتاحة
            </p>
          </div>
        ) : (
          <>
            {/* Progress Bar - Enhanced */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground">التقدم</span>
                <span className={cn("font-medium", getStatusColor())}>
                  {completedCount} / {total} دروس
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    isComplete
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-primary/70 to-primary",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Subjects - Collapsible */}
            <div className={cn("space-y-4 transition-all duration-300")}>
              {day.subjects.map((subject) => (
                <div key={subject.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-0.5 rounded-full bg-primary/30" />
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {subject.title}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {subject.chapters.length}
                    </Badge>
                  </div>

                  {subject.chapters.map((chapter) => {
                    const chapterCompleted = chapter.lessons.filter(
                      (l) => l.completions.length > 0,
                    ).length;
                    const chapterTotal = chapter.lessons.length;
                    const chapterProgress =
                      chapterTotal > 0
                        ? Math.round((chapterCompleted / chapterTotal) * 100)
                        : 0;

                    return (
                      <div
                        key={chapter.id}
                        className="border-r-2 border-border/40 pr-3 mr-2 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">
                            {chapter.title}
                          </p>
                          {chapterTotal > 0 && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {chapterProgress}%
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
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
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Expand/Collapse indicator */}
            {!isExpanded && total > 3 && (
              <div className="relative mt-2">
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative mt-1 w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(true)}
                >
                  عرض الكل
                  <ChevronDown className="h-3 w-3 mr-1" />
                </Button>
              </div>
            )}

            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(false)}
              >
                طي
                <ChevronUp className="h-3 w-3 mr-1" />
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
