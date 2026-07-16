"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X, BookOpen, Layers, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { cn } from "@/lib/utils";
import type {
  StudyTableDayDetailed,
  UpdateDaySubjectsPayload,
} from "@/types/study-table";
import { STATIC_SUBJECTS } from "@/data/subjects-data";
import { formatDayHeading } from "@/data/date";

interface DaySubjectsEditorDialogProps {
  day: StudyTableDayDetailed | null;
  onClose: () => void;
  onSave: (
    dayId: string,
    payload: UpdateDaySubjectsPayload,
    hasExisting: boolean,
  ) => void;
  isSaving: boolean;
}

/** Key for a single lesson, addressed by its position in STATIC_SUBJECTS. */
function lessonKey(si: number, ci: number, li: number) {
  return `${si}:${ci}:${li}`;
}

function parseLessonKey(key: string) {
  const [si, ci, li] = key.split(":").map(Number);
  return { si, ci, li };
}

function buildInitialSelection(day: StudyTableDayDetailed | null): Set<string> {
  const selected = new Set<string>();
  if (!day) return selected;

  day.subjects.forEach((subject) => {
    const si = STATIC_SUBJECTS.findIndex((s) => s.title === subject.title);
    if (si === -1) return;
    subject.chapters.forEach((chapter) => {
      const ci = STATIC_SUBJECTS[si].chapters.findIndex(
        (c) => c.title === chapter.title,
      );
      if (ci === -1) return;
      chapter.lessons.forEach((lesson) => {
        const li = STATIC_SUBJECTS[si].chapters[ci].lessons.findIndex(
          (l) => l.title === lesson.title,
        );
        if (li === -1) return;
        selected.add(lessonKey(si, ci, li));
      });
    });
  });

  return selected;
}

export function DaySubjectsEditorDialog({
  day,
  onClose,
  onSave,
  isSaving,
}: DaySubjectsEditorDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subjectIndex, setSubjectIndex] = useState<string>("");
  const [chapterIndex, setChapterIndex] = useState<string>("");

  useEffect(() => {
    setSelected(buildInitialSelection(day));
    setSubjectIndex("");
    setChapterIndex("");
  }, [day]);

  const si = subjectIndex === "" ? null : Number(subjectIndex);
  const ci = chapterIndex === "" ? null : Number(chapterIndex);

  const chapters = si !== null ? STATIC_SUBJECTS[si].chapters : [];
  const lessons = si !== null && ci !== null ? chapters[ci].lessons : [];

  const summaryItems = useMemo(() => {
    return Array.from(selected).map((key) => {
      const { si, ci, li } = parseLessonKey(key);
      const subject = STATIC_SUBJECTS[si];
      const chapter = subject.chapters[ci];
      const lesson = chapter.lessons[li];
      return {
        key,
        subject: subject.title,
        chapter: chapter.title,
        lesson: lesson.title,
      };
    });
  }, [selected]);

  if (!day) return null;

  const currentDay = day;
  const hasExisting = currentDay.subjects.length > 0;

  function toggleLesson(lessonSi: number, lessonCi: number, lessonLi: number) {
    const key = lessonKey(lessonSi, lessonCi, lessonLi);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function removeSelection(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleSave() {
    const payload: UpdateDaySubjectsPayload = { subjects: [] };

    STATIC_SUBJECTS.forEach((subject, subjIdx) => {
      const chaptersToSend = subject.chapters
        .map((chapter, chapIdx) => {
          const lessonsToSend = chapter.lessons.filter((_, lessonIdx) =>
            selected.has(lessonKey(subjIdx, chapIdx, lessonIdx)),
          );
          return lessonsToSend.length > 0
            ? { title: chapter.title, lessons: lessonsToSend }
            : null;
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      if (chaptersToSend.length > 0) {
        payload.subjects.push({
          title: subject.title,
          chapters: chaptersToSend,
        });
      }
    });

    onSave(currentDay.id, payload, hasExisting);
  }

  return (
    <Dialog open={!!day} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header with consistent padding */}
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold">
            {formatDayHeading(currentDay.date)}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            اختر الدروس التي تريد دراستها في هذا اليوم
          </p>
        </DialogHeader>

        <Separator />

        {/* Main content with scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Selection section */}
          <div className="space-y-4">
            {/* Subject selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BookOpen className="h-4 w-4 text-primary" />
                المادة
              </label>
              <Select
                value={subjectIndex}
                onValueChange={(value) => {
                  setSubjectIndex(value ?? "");
                  setChapterIndex("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {STATIC_SUBJECTS.map((subject, index) => (
                    <SelectItem key={subject.title} value={String(index)}>
                      {subject.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Chapter selection - only when subject is selected */}
            {si !== null && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  الفصل
                </label>
                <Select
                  value={chapterIndex}
                  onValueChange={(value) => setChapterIndex(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((chapter, index) => (
                      <SelectItem key={chapter.title} value={String(index)}>
                        {chapter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lessons - only when chapter is selected */}
            {si !== null && ci !== null && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ListChecks className="h-4 w-4 text-primary" />
                  الدروس
                </label>
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  {lessons.map((lesson, li) => (
                    <label
                      key={lesson.title}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(lessonKey(si, ci, li))}
                        onCheckedChange={() => toggleLesson(si, ci, li)}
                        className="mt-0.5"
                      />
                      <span className="text-sm">{lesson.title}</span>
                    </label>
                  ))}
                  {lessons.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      لا توجد دروس في هذا الفصل
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected lessons summary */}
          {summaryItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    الدروس المختارة
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {summaryItems.length} درس
                  </Badge>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="flex flex-wrap gap-2 pr-1 pb-1">
                    {summaryItems.map((item) => (
                      <Badge
                        key={item.key}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1.5 px-3 text-xs max-w-full"
                      >
                        <span className="truncate">
                          <span className="font-medium">{item.subject}</span>
                          <span className="text-muted-foreground mx-1">›</span>
                          <span>{item.chapter}</span>
                          <span className="text-muted-foreground mx-1">:</span>
                          <span>{item.lesson}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelection(item.key)}
                          aria-label="إزالة"
                          className={cn(
                            "rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive flex-shrink-0",
                          )}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* Empty state */}
          {summaryItems.length === 0 && si === null && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                اختر المادة والفصل ثم الدروس من الأعلى
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer with consistent padding */}
        <DialogFooter className="px-6 py-4 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selected.size} درس محدد
            </span>
            {hasExisting && (
              <Badge variant="outline" className="text-xs">
                تعديل
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || selected.size === 0}
              className="min-w-[100px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}