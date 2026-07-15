"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
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

  // Cascading picker state — which subject/chapter is currently open.
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

  // Group current selections for the summary chips, e.g. "الرياضيات › الجبر: المعادلات الخطية"
  const summaryItems = useMemo(() => {
    return Array.from(selected).map((key) => {
      const { si, ci, li } = parseLessonKey(key);
      const subject = STATIC_SUBJECTS[si];
      const chapter = subject.chapters[ci];
      const lesson = chapter.lessons[li];
      return {
        key,
        label: `${subject.title} › ${chapter.title}: ${lesson.title}`,
      };
    });
  }, [selected]);

  // ✅ Early return now comes AFTER every hook call (useState x3, useEffect, useMemo)
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formatDayHeading(currentDay.date)}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Step 1: subject */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              المادة
            </label>
            <Select
              value={subjectIndex}
              onValueChange={(value) => {
                setSubjectIndex(value ?? "");
                setChapterIndex(""); // reset chapter when subject changes
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

          {/* Step 2: chapter (only once a subject is chosen) */}
          {si !== null && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
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

          {/* Step 3: lessons (only once a chapter is chosen) */}
          {si !== null && ci !== null && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                الدروس
              </label>
              <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                {lessons.map((lesson, li) => (
                  <label
                    key={lesson.title}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={selected.has(lessonKey(si, ci, li))}
                      onCheckedChange={() => toggleLesson(si, ci, li)}
                    />
                    {lesson.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Summary of everything picked so far, across subjects/chapters */}
          {summaryItems.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                الدروس المختارة ({summaryItems.length})
              </label>
              <ScrollArea className="max-h-32">
                <div className="flex flex-wrap gap-1.5 pr-1">
                  {summaryItems.map((item) => (
                    <Badge
                      key={item.key}
                      variant="secondary"
                      className="flex items-center gap-1 pl-1.5"
                    >
                      {item.label}
                      <button
                        type="button"
                        onClick={() => removeSelection(item.key)}
                        aria-label="إزالة"
                        className={cn(
                          "rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {selected.size} درس محدد
          </span>
          <Button
            onClick={handleSave}
            disabled={isSaving || selected.size === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
