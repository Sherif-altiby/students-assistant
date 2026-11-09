"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ListPlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import MainButton from "@/components/ui/MainButton";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudySubject, listStudySubjects } from "@/lib/study-table";
import { cn } from "@/lib/utils";
import type {
  StudySessionReplacement,
  StudyTableDay,
  StudyTableSubject,
} from "@/types/study-table";
import { dateLabel, getLessons } from "./study-table-utils";

interface EditableSession {
  key: string;
  subjectId: string;
  lessonId: string;
}

function DaySessionEditorRow({
  session,
  index,
  count,
  subjects,
  unavailableLessonIds,
  onChange,
  onMove,
  onRemove,
}: {
  session: EditableSession;
  index: number;
  count: number;
  subjects: Array<{ id: string; title: string }>;
  unavailableLessonIds: Set<string>;
  onChange: (session: EditableSession) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const subjectQuery = useQuery({
    queryKey: ["study-subject", session.subjectId],
    queryFn: () => getStudySubject(session.subjectId),
    enabled: Boolean(session.subjectId),
  });
  const lessons = subjectQuery.data ? getLessons(subjectQuery.data) : [];
  const selectableLessons = lessons.filter(
    (lesson) => lesson.id === session.lessonId || !unavailableLessonIds.has(lesson.id),
  );

  return (
    <div className="group/row rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-[11px] font-bold tabular-nums text-primary">
            {index + 1}
          </span>
          الجلسة {index + 1}
        </span>
        <div className="flex items-center gap-0.5 opacity-60 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
          <MainButton
            type="button"
            title="نقل لأعلى"
            icon={<ArrowUp />}
            iconOnly
            size="icon-sm"
            variant="ghost"
            aria-label="نقل لأعلى"
            disabled={index === 0}
            className="rounded-lg text-muted-foreground"
            onClick={() => onMove(-1)}
          />
          <MainButton
            type="button"
            title="نقل لأسفل"
            icon={<ArrowDown />}
            iconOnly
            size="icon-sm"
            variant="ghost"
            aria-label="نقل لأسفل"
            disabled={index === count - 1}
            className="rounded-lg text-muted-foreground"
            onClick={() => onMove(1)}
          />
          <MainButton
            type="button"
            title={`حذف الجلسة ${index + 1}`}
            icon={<Trash2 />}
            iconOnly
            size="icon-sm"
            variant="ghost"
            aria-label={`حذف الجلسة ${index + 1}`}
            className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>المادة</span>
          <CustomSelect
            value={session.subjectId}
            onChange={(subjectId) => onChange({ ...session, subjectId, lessonId: "" })}
            placeholder="اختر المادة"
            options={subjects.map((subject) => ({
              value: subject.id,
              label: subject.title,
            }))}
          />
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span>الدرس</span>
          <CustomSelect
            value={session.lessonId}
            disabled={
              !session.subjectId ||
              subjectQuery.isLoading ||
              subjectQuery.isError ||
              !lessons.length
            }
            onChange={(lessonId) => onChange({ ...session, lessonId })}
            placeholder={
              !session.subjectId
                ? "اختر المادة أولاً"
                : subjectQuery.isLoading
                  ? "جارٍ تحميل الدروس..."
                  : subjectQuery.isError
                    ? "تعذر تحميل الدروس"
                    : lessons.length
                      ? "اختر الدرس"
                      : "لا توجد دروس بهذه المادة"
            }
            options={lessons.map((lesson) => {
              const alreadyScheduled =
                unavailableLessonIds.has(lesson.id) && lesson.id !== session.lessonId;
              return {
                value: lesson.id,
                label: `${lesson.title}${alreadyScheduled ? " — مضاف ليوم آخر" : ""}`,
                disabled: alreadyScheduled,
              };
            })}
          />
          {subjectQuery.isError && (
            <span role="alert" className="block text-xs text-destructive">
              تعذر تحميل دروس المادة
            </span>
          )}
          {lessons.length > 0 && selectableLessons.length === 0 && (
            <span className="block text-xs text-muted-foreground">
              جميع دروس المادة مضافة إلى أيام أخرى في هذا الجدول
            </span>
          )}
        </label>
      </div>
    </div>
  );
}

export function DaySessionEditor({
  day,
  unavailableLessonIds,
  tableSubjects,
  allSubjects,
  isSaving,
  onSave,
  onClose,
}: {
  day: StudyTableDay;
  unavailableLessonIds: Set<string>;
  tableSubjects: StudyTableSubject[];
  allSubjects: boolean;
  isSaving: boolean;
  onSave: (sessions: StudySessionReplacement[]) => Promise<void>;
  onClose: () => void;
}) {
  const subjectListQuery = useQuery({
    queryKey: ["study-subjects"],
    queryFn: listStudySubjects,
    enabled: allSubjects,
  });
  const subjects = allSubjects
    ? (subjectListQuery.data ?? [])
    : tableSubjects.map(({ subject }) => subject);
  const [sessions, setSessions] = useState<EditableSession[]>(() =>
    [...day.sessions]
      .sort((a, b) => a.order - b.order)
      .map((session) => ({
        key: session.id,
        subjectId: session.subjectId,
        lessonId: session.lessonId,
      })),
  );

  const hasIncomplete = sessions.some((s) => !s.subjectId || !s.lessonId);
  const hasDuplicate =
    new Set(sessions.map((s) => s.lessonId)).size !== sessions.length;
  const isValid = !hasIncomplete && !hasDuplicate;
  const isLoadingSubjects = allSubjects && subjectListQuery.isLoading;

  const hint = hasIncomplete
    ? "اختر مادة ودرساً لكل جلسة"
    : hasDuplicate
      ? "لا يمكن تكرار الدرس نفسه في اليوم"
      : sessions.length === 0
        ? "سيتم إفراغ هذا اليوم من الجلسات"
        : `${sessions.length} جلسة في هذا اليوم`;

  async function save() {
    if (!isValid) return;
    await onSave(
      sessions.map(({ subjectId, lessonId }, order) => ({
        subjectId,
        lessonId,
        order,
      })),
    );
  }

  function addSession() {
    setSessions((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        subjectId: subjects[0]?.id ?? "",
        lessonId: "",
      },
    ]);
  }

  function moveSession(index: number, direction: -1 | 1) {
    setSessions((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-0 shadow-2xl sm:max-w-2xl"
      >
        <DialogClose
          render={
            <MainButton
              title="إغلاق"
              icon={<X />}
              iconOnly
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 z-10 rounded-xl text-muted-foreground"
            />
          }
        />

        <DialogHeader className="gap-4 border-b border-border/60 bg-gradient-to-br from-primary/[0.07] via-card to-card px-6 py-6 pe-16 text-start sm:px-7 sm:py-7 sm:pe-20">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                  تعديل جلسات اليوم
                </DialogTitle>
                <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
                  {sessions.length} جلسة
                </span>
              </div>
              <DialogDescription className="leading-relaxed">
                رتّب الدروس بالترتيب الذي ستذاكرها به، ويمكنك إضافة درس أو حذفه.
              </DialogDescription>
              <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {dateLabel(day.date)}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-5 sm:px-6">
          {allSubjects && subjectListQuery.isError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              تعذر تحميل المواد
            </p>
          )}

          {sessions.map((session, index) => (
            <DaySessionEditorRow
              key={session.key}
              session={session}
              index={index}
              count={sessions.length}
              subjects={subjects}
              unavailableLessonIds={unavailableLessonIds}
              onChange={(updated) =>
                setSessions((current) =>
                  current.map((item, i) => (i === index ? updated : item)),
                )
              }
              onMove={(direction) => moveSession(index, direction)}
              onRemove={() =>
                setSessions((current) => current.filter((_, i) => i !== index))
              }
            />
          ))}

          {!sessions.length && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <ListPlus className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">لا توجد جلسات لهذا اليوم</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                ابدأ بإضافة أول درس لمتابعة تقدمك في هذا اليوم.
              </p>
            </div>
          )}

          <MainButton
            type="button"
            title="إضافة درس"
            icon={<Plus />}
            variant="outline"
            className="h-12 w-full rounded-xl border-dashed bg-card text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            disabled={!subjects.length || isLoadingSubjects}
            onClick={addSession}
          />
        </div>

        <DialogFooter className="flex-col-reverse gap-3 border-t border-border/60 bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              isValid
                ? "text-muted-foreground"
                : "font-medium text-amber-700 dark:text-amber-400",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                isValid ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            {hint}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <MainButton
              type="button"
              title="إلغاء"
              variant="outline"
              className="h-11 flex-1 rounded-xl sm:flex-none"
              onClick={onClose}
            />
            <MainButton
              type="button"
              title="حفظ جلسات اليوم"
              loading={isSaving}
              loadingTitle="جارٍ الحفظ..."
              className="h-11 flex-1 rounded-xl sm:flex-none"
              disabled={isSaving || isLoadingSubjects || !isValid}
              onClick={() => void save()}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}