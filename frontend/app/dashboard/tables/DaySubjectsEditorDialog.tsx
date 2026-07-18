"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Loader2, 
  X, 
  BookOpen, 
  Layers, 
  ListChecks,
  Check,
  ChevronRight,
  Calendar,
  ClipboardList
} from "lucide-react";
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
import { CustomSelect } from "@/components/ui/CustomSelect";
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
  const [activeTab, setActiveTab] = useState<"select" | "summary">("select");

  useEffect(() => {
    setSelected(buildInitialSelection(day));
    setSubjectIndex("");
    setChapterIndex("");
    setActiveTab("select");
  }, [day]);

  const si = subjectIndex === "" ? null : Number(subjectIndex);
  const ci = chapterIndex === "" ? null : Number(chapterIndex);

  const chapters = si !== null ? STATIC_SUBJECTS[si].chapters : [];
  const lessons = si !== null && ci !== null ? chapters[ci].lessons : [];

  const subjectOptions = useMemo(
    () =>
      STATIC_SUBJECTS.map((subject, index) => ({
        value: String(index),
        label: subject.title,
      })),
    [],
  );

  const chapterOptions = useMemo(
    () =>
      chapters.map((chapter, index) => ({
        value: String(index),
        label: chapter.title,
      })),
    [chapters],
  );

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

  // Helper to get subject name by index
  const getSubjectName = (index: number | null) => {
    if (index === null) return "";
    return STATIC_SUBJECTS[index]?.title || "";
  };

  return (
    <Dialog open={!!day} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]  flex flex-col py-5 rounded-2xl">
        {/* Enhanced Header with gradient background */}
        <div className="from-primary/5 via-primary/10 to-transparent px-6 py-5 border-b">
          <DialogHeader className="p-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {formatDayHeading(currentDay.date)}
                </DialogTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5" />
                  اختر الدروس التي تريد دراستها في هذا اليوم
                  {hasExisting && (
                    <Badge variant="secondary" className="text-xs">
                      تعديل
                    </Badge>
                  )}
                </p>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs font-medium bg-primary/5 border-primary/20 px-3 py-1"
              >
                {selected.size} درس محدد
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 pt-2">
          <button
            onClick={() => setActiveTab("select")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative",
              activeTab === "select"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            اختيار الدروس
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all relative",
              activeTab === "summary"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListChecks className="h-4 w-4" />
            الدروس المختارة
            {selected.size > 0 && (
              <Badge className="ml-1 text-xs bg-primary text-primary-foreground">
                {selected.size}
              </Badge>
            )}
          </button>
        </div>

        {/* Main content with scroll */}
        <div className="flex-1  px-6 py-4">
          {activeTab === "select" ? (
            <div className="space-y-6">
              {/* Selection section with improved styling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" />
                    المادة
                  </label>
                  <CustomSelect
                    value={subjectIndex}
                    onChange={(value) => {
                      setSubjectIndex(value);
                      setChapterIndex("");
                    }}
                    options={subjectOptions}
                    placeholder="اختر المادة"
                  />
                </div>

                {/* Chapter selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Layers className="h-4 w-4 text-primary" />
                    الفصل
                  </label>
                  <CustomSelect
                    value={chapterIndex}
                    onChange={(value) => setChapterIndex(value)}
                    options={chapterOptions}
                    placeholder={si !== null ? "اختر الفصل" : "اختر المادة أولاً"}
                    disabled={si === null}
                  />
                </div>
              </div>

              {/* Lessons - enhanced display */}
              {si !== null && ci !== null && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ListChecks className="h-4 w-4 text-primary" />
                      الدروس
                      <span className="text-xs text-muted-foreground">
                        ({lessons.length} درس)
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        const allKeys = lessons.map((_, li) => lessonKey(si, ci, li));
                        const allSelected = allKeys.every(key => selected.has(key));
                        setSelected(prev => {
                          const next = new Set(prev);
                          if (allSelected) {
                            allKeys.forEach(key => next.delete(key));
                          } else {
                            allKeys.forEach(key => next.add(key));
                          }
                          return next;
                        });
                      }}
                    >
                      {lessons.every((_, li) => selected.has(lessonKey(si, ci, li)))
                        ? "إلغاء الكل"
                        : "تحديد الكل"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-xl border border-border bg-card p-4">
                    {lessons.map((lesson, li) => {
                      const key = lessonKey(si, ci, li);
                      const isSelected = selected.has(key);
                      return (
                        <label
                          key={lesson.title}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group",
                            isSelected
                              ? "bg-primary/10 border border-primary/30 hover:bg-primary/15"
                              : "bg-muted/20 border border-transparent hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleLesson(si, ci, li)}
                            className="mt-0.5 data-[state=checked]:bg-primary"
                          />
                          <span className={cn(
                            "text-sm flex-1",
                            isSelected ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {lesson.title}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                        </label>
                      );
                    })}
                    {lessons.length === 0 && (
                      <div className="col-span-full text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          لا توجد دروس في هذا الفصل
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty state - enhanced */}
              {si === null && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted/30 p-4 mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    اختر مادة من القائمة أعلاه
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    ستظهر الدروس المتاحة بعد اختيار المادة والفصل
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Summary Tab
            <div className="space-y-4">
              {summaryItems.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">الدروس المختارة</h4>
                    <Badge variant="outline" className="text-xs">
                      {summaryItems.length} درس
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {summaryItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-foreground">
                              {item.subject}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">
                              {item.chapter}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground">
                              {item.lesson}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelection(item.key)}
                          aria-label="إزالة"
                          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive flex-shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted/30 p-4 mb-4">
                    <ListChecks className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    لا توجد دروس مختارة
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    انتقل إلى تبويب "اختيار الدروس" لإضافة دروس
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Enhanced Footer */}
        <DialogFooter className="px-6 py-4 flex items-center justify-between sm:justify-between bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {selected.size}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                درس {selected.size === 1 ? "محدد" : "محددة"}
              </span>
            </div>
            {hasExisting && (
              <Badge 
                variant="outline" 
                className="text-xs border-amber-200 bg-amber-50 text-amber-700"
              >
                تعديل
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="hover:bg-muted"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || selected.size === 0}
              className="min-w-[120px] bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}