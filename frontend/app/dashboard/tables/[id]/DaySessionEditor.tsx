"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudySubject, listStudySubjects } from "@/lib/study-table";
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
    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">الجلسة {index + 1}</span>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="نقل لأعلى"
            title="نقل لأعلى"
            disabled={index === 0}
            className="rounded-lg text-muted-foreground"
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="نقل لأسفل"
            title="نقل لأسفل"
            disabled={index === count - 1}
            className="rounded-lg text-muted-foreground"
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label={`حذف الجلسة ${index + 1}`}
            title="حذف من اليوم"
            className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
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
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border/60 px-6 py-5 text-start">
          <DialogTitle className="text-xl">تعديل جلسات اليوم</DialogTitle>
          <DialogDescription>
            {dateLabel(day.date)} — رتّب الدروس بالترتيب الذي ستذاكرها به.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-6 py-5">
          {allSubjects && subjectListQuery.isError && (
            <p role="alert" className="text-sm text-destructive">
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
            <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              لا توجد جلسات لهذا اليوم. أضف درساً للبدء.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 rounded-xl border-dashed bg-card"
            disabled={!subjects.length || isLoadingSubjects}
            onClick={addSession}
          >
            <Plus className="size-4" />
            إضافة درس
          </Button>
        </div>

        <DialogFooter className="flex-col-reverse gap-3 border-t border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p
            aria-live="polite"
            className={
              isValid
                ? "text-xs text-muted-foreground"
                : "text-xs font-medium text-amber-700 dark:text-amber-400"
            }
          >
            {hint}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl sm:flex-none" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl sm:flex-none"
              disabled={isSaving || isLoadingSubjects || !isValid}
              onClick={() => void save()}
            >
              {isSaving ? "جارٍ الحفظ..." : "حفظ جلسات اليوم"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}