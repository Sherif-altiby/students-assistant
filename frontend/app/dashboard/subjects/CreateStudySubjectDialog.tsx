"use client";

import {
  useState,
  useId,
  useRef,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createStudySubject } from "@/lib/study-table";
import { cn } from "@/lib/utils";
import type { CreateStudySubjectInput } from "@/types/study-table";

interface LessonDraft {
  id: string;
  title: string;
}

interface UnitDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
}

const isUnitIncomplete = (unit: UnitDraft) =>
  !unit.title.trim() ||
  unit.lessons.length === 0 ||
  unit.lessons.some((lesson) => !lesson.title.trim());

function focusField(id: string) {
  setTimeout(() => document.getElementById(id)?.focus(), 30);
}

export function CreateStudySubjectDialog() {
  const queryClient = useQueryClient();
  const idPrefix = useId();
  const idSequence = useRef(0);
  const nextDraftId = () => `${idPrefix}-${++idSequence.current}`;
  const createUnit = (): UnitDraft => ({
    id: nextDraftId(),
    title: "",
    lessons: [{ id: nextDraftId(), title: "" }],
  });
  const createInitialUnit = (): UnitDraft => ({
    id: `${idPrefix}-initial-unit`,
    title: "",
    lessons: [{ id: `${idPrefix}-initial-lesson`, title: "" }],
  });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [units, setUnits] = useState<UnitDraft[]>(() => [createInitialUnit()]);
  const [error, setError] = useState<string | null>(null);
  const [showIncomplete, setShowIncomplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lessonCount = units.reduce((sum, unit) => sum + unit.lessons.length, 0);

  function reset() {
    setTitle("");
    setUnits([createUnit()]);
    setError(null);
    setShowIncomplete(false);
  }

  function updateUnit(unitId: string, patch: Partial<UnitDraft>) {
    setUnits((current) =>
      current.map((unit) =>
        unit.id === unitId ? { ...unit, ...patch } : unit,
      ),
    );
  }

  function updateLesson(unitId: string, lessonId: string, value: string) {
    setUnits((current) =>
      current.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, title: value } : lesson,
              ),
            }
          : unit,
      ),
    );
  }

  function addUnit() {
    const unit = createUnit();
    setUnits((current) => [...current, unit]);
    focusField(`unit-${unit.id}`);
  }

  function addLesson(
    unitId: string,
    afterLessonId?: string,
    titles?: string[],
  ) {
    const created = (titles?.length ? titles : [""]).map((title) => ({
      id: nextDraftId(),
      title,
    }));
    setUnits((current) =>
      current.map((unit) => {
        if (unit.id !== unitId) return unit;
        const index = afterLessonId
          ? unit.lessons.findIndex((lesson) => lesson.id === afterLessonId) + 1
          : unit.lessons.length;
        const lessons = [...unit.lessons];
        lessons.splice(index, 0, ...created);
        return { ...unit, lessons };
      }),
    );
    focusField(`lesson-${created[created.length - 1].id}`);
  }

  // Enter in a lesson field adds the next lesson instead of submitting.
  function handleLessonKeyDown(
    event: KeyboardEvent<HTMLLIElement>,
    unitId: string,
    lessonId: string,
  ) {
    if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement)) {
      return;
    }
    event.preventDefault();
    addLesson(unitId, lessonId);
  }

  // Pasting several lines splits them into separate lessons.
  function handleLessonPaste(
    event: ClipboardEvent<HTMLLIElement>,
    unitId: string,
    lessonId: string,
  ) {
    const lines = event.clipboardData
      .getData("text")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) return;

    event.preventDefault();
    const [first, ...rest] = lines;
    updateLesson(unitId, lessonId, first);
    addLesson(unitId, lessonId, rest);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: CreateStudySubjectInput = {
      title: title.trim(),
      units: units.map((unit) => ({
        title: unit.title.trim(),
        lessons: unit.lessons.map((lesson) => ({ title: lesson.title.trim() })),
      })),
    };

    if (!payload.title || units.some(isUnitIncomplete)) {
      setShowIncomplete(true);
      setError(
        "أكمل اسم المادة وعنوان كل وحدة وكل درس، أو احذف الحقول الفارغة.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createStudySubject(payload);
      await queryClient.invalidateQueries({ queryKey: ["study-subjects"] });
      toast.success("تم إنشاء المادة ووحداتها ودروسها");
      reset();
      setOpen(false);
    } catch (requestError) {
      const responseMessage =
        requestError instanceof AxiosError
          ? requestError.response?.data?.message
          : undefined;
      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : "تعذر إنشاء المادة. يرجى المحاولة مرة أخرى.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger
        render={<MainButton icon={<Plus />} title="إنشاء مادة" />}
      />
      <DialogContent
        dir="rtl"
        closeButtonClassName="right-auto left-2"
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-start">
          <DialogTitle className="text-xl font-bold">
            إنشاء مادة دراسية
          </DialogTitle>
          <DialogDescription>
            ابدأ باسم المادة، ثم رتّب وحداتها ودروس كل وحدة.
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-study-subject-form"
          className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5"
          onSubmit={handleSubmit}
        >
          <FormInput
            id="new-study-subject-title"
            label="اسم المادة"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={255}
          />

          <ol className="space-y-4">
            {units.map((unit, unitIndex) => {
              const incomplete = showIncomplete && isUnitIncomplete(unit);

              return (
                <li
                  key={unit.id}
                  className={cn(
                    "rounded-2xl border bg-muted/20 p-4 transition-colors",
                    incomplete
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border/60",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-7 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                    >
                      {unitIndex + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <FormInput
                        id={`unit-${unit.id}`}
                        label={`عنوان الوحدة ${unitIndex + 1}`}
                        value={unit.title}
                        onChange={(event) =>
                          updateUnit(unit.id, { title: event.target.value })
                        }
                        required
                        maxLength={255}
                      />
                    </div>
                    {units.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`حذف الوحدة ${unitIndex + 1}`}
                        className="mt-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setUnits((current) =>
                            current.filter((item) => item.id !== unit.id),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <ol className="mt-4 me-0 ms-4 space-y-3 border-s-2 border-primary/20 ps-4">
                    {unit.lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lesson.id}
                        className="flex items-start gap-3"
                        onKeyDown={(event) =>
                          handleLessonKeyDown(event, unit.id, lesson.id)
                        }
                        onPaste={(event) =>
                          handleLessonPaste(event, unit.id, lesson.id)
                        }
                      >
                        <span
                          aria-hidden
                          className="mt-8 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs text-muted-foreground"
                        >
                          {lessonIndex + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <FormInput
                            id={`lesson-${lesson.id}`}
                            label={`عنوان الدرس ${lessonIndex + 1}`}
                            value={lesson.title}
                            onChange={(event) =>
                              updateLesson(
                                unit.id,
                                lesson.id,
                                event.target.value,
                              )
                            }
                            required
                            maxLength={500}
                          />
                        </div>
                        {unit.lessons.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`حذف الدرس ${lessonIndex + 1}`}
                            className="mt-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              updateUnit(unit.id, {
                                lessons: unit.lessons.filter(
                                  (item) => item.id !== lesson.id,
                                ),
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </li>
                    ))}

                    <li className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ms-2 gap-1.5 text-primary"
                        onClick={() => addLesson(unit.id)}
                      >
                        <Plus className="size-4" />
                        إضافة درس
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        اضغط Enter لإضافة درس تالٍ 
                      </span>
                    </li>
                  </ol>
                </li>
              );
            })}
          </ol>

          <MainButton
            type="button"
            onClick={addUnit}
            icon={<Plus className="size-4" />}
            title="إضافة وحدة"
            fullWidth
          />

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </form>

        <DialogFooter className="mx-0 mb-0 flex-row items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-6 py-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {units.length} {units.length === 1 ? "وحدة" : "وحدات"} ·{" "}
            {lessonCount} {lessonCount === 1 ? "درس" : "دروس"}
          </p>
          <div className="flex items-center gap-3">
            <MainButton
              type="button"
              title="إلغاء"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            />
              
            <MainButton
              type="submit"
              title="إنشاء المادة"
              loading={isSubmitting}
              loadingTitle="جارٍ الحفظ..."
              form="create-study-subject-form"
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
