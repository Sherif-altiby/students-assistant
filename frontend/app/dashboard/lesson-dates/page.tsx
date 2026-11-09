"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  formatDuration,
  LessonDateForm,
  LessonDateOverview,
  LessonDateSchedule,
  toMinutes,
  type LessonDateFormValues,
} from "@/components/dashboard/lesson-dates/lesson-date-components";
import { useLessonDates } from "@/hooks/useLessonDates";
import { ARABIC_DAYS_ORDERED } from "@/lib/day-mapping";
import { listStudySubjects } from "@/lib/study-table";
import type { LessonDate } from "@/types/lesson-date";

const EMPTY_FORM: LessonDateFormValues = {
  subject: "",
  teacher: "",
  dayNames: [],
  startTime: "",
  endTime: "",
};

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return (
    toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA)
  );
}

export default function LessonDatesPage() {
  const subjectsQuery = useQuery({
    queryKey: ["study-subjects"],
    queryFn: listStudySubjects,
  });
  const subjects = subjectsQuery.data ?? [];
  const {
    lessonDates,
    isLoading,
    loadError,
    saveLessonDate,
    isSaving,
    extractErrorMessage,
    deleteLessonDate,
    deletingId,
    downloadLessonDatesPdf,
  } = useLessonDates();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<string, LessonDate[]>(
      ARABIC_DAYS_ORDERED.map((day) => [day, [] as LessonDate[]]),
    );
    for (const lesson of lessonDates) grouped.get(lesson.dayName)?.push(lesson);
    for (const lessons of grouped.values()) {
      lessons.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    }
    return grouped;
  }, [lessonDates]);

  const todayName = ARABIC_DAYS_ORDERED[new Date().getDay()];
  const nextLesson = useMemo(() => {
    if (lessonDates.length === 0) return null;
    const now = new Date();
    const todayIndex = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let offset = 0; offset < 7; offset += 1) {
      const dayName = ARABIC_DAYS_ORDERED[(todayIndex + offset) % 7];
      const lessons = (scheduleByDay.get(dayName) ?? []).filter((lesson) =>
        offset === 0 ? toMinutes(lesson.startTime) > nowMinutes : true,
      );
      if (lessons[0]) return { ...lessons[0], dayName, isToday: offset === 0 };
    }
    return null;
  }, [lessonDates.length, scheduleByDay]);

  const durationLabel = useMemo(
    () => formatDuration(form.startTime, form.endTime),
    [form.startTime, form.endTime],
  );
  const totalCount = lessonDates.length;
  const activeDaysCount = useMemo(
    () =>
      [...scheduleByDay.values()].filter((lessons) => lessons.length > 0)
        .length,
    [scheduleByDay],
  );
  const todayCount = scheduleByDay.get(todayName)?.length ?? 0;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = form.subject.trim();
    const teacher = form.teacher.trim();
    const { dayNames, startTime, endTime } = form;

    if (subjectsQuery.isError) {
      setFormError("تعذر تحميل المواد الدراسية. يرجى المحاولة مرة أخرى.");
      return;
    }
    if (!editingId && subjectsQuery.isLoading) {
      setFormError("جارٍ تحميل المواد الدراسية. يرجى الانتظار.");
      return;
    }
    if (
      !subject ||
      (!editingId && !subjects.some((item) => item.title === subject)) ||
      !teacher ||
      dayNames.length === 0 ||
      !startTime ||
      !endTime
    ) {
      setFormError("الرجاء إدخال جميع الحقول (المادة، المعلم، اليوم، الوقت).");
      return;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setFormError("وقت النهاية يجب أن يكون بعد وقت البداية.");
      return;
    }

    const conflict = lessonDates.find(
      (lesson) =>
        dayNames.includes(lesson.dayName) &&
        lesson.id !== editingId &&
        overlaps(startTime, endTime, lesson.startTime, lesson.endTime),
    );
    if (conflict) {
      setFormError(
        `يتعارض هذا الموعد يوم ${conflict.dayName} مع "${conflict.subject}" (${conflict.startTime} - ${conflict.endTime}).`,
      );
      return;
    }

    setFormError("");
    try {
      const payload = editingId
        ? { subject, teacher, dayName: dayNames[0], startTime, endTime }
        : { subject, teacher, dayNames, startTime, endTime };
      await saveLessonDate(payload, editingId);
      resetForm();
    } catch (error) {
      setFormError(extractErrorMessage(error, "حدث خطأ أثناء الحفظ."));
    }
  }

  function handleEdit(lesson: LessonDate) {
    setEditingId(lesson.id);
    setForm({
      subject: lesson.subject,
      teacher: lesson.teacher,
      dayNames: [lesson.dayName],
      startTime: lesson.startTime,
      endTime: lesson.endTime,
    });
    setFormError("");
  }

  async function confirmDelete(id: string) {
    setDeleteError("");
    try {
      await deleteLessonDate(id);
      if (editingId === id) resetForm();
      setPendingDeleteId(null);
    } catch (error) {
      setDeleteError(extractErrorMessage(error, "تعذر حذف الموعد."));
    }
  }

  return (
    <div className="space-y-6 p-4">
      <PageHeader
        title="مواعيد الدروس"
        description="تابع جدولك الأسبوعي، وأضف أو حدّث أو احذف مواعيدك بسهولة."
      />
      <LessonDateOverview
        totalCount={totalCount}
        activeDaysCount={activeDaysCount}
        todayCount={todayCount}
        nextLesson={!isLoading && !loadError ? nextLesson : null}
        showStats={!isLoading && !loadError}
        pdfDisabled={isLoading || totalCount === 0}
        onDownloadPdf={() => downloadLessonDatesPdf()}
      />
      <LessonDateForm
        form={form}
        setForm={setForm}
        editing={Boolean(editingId)}
        onSubmit={handleSubmit}
        onReset={resetForm}
        isSaving={isSaving}
        formError={formError}
        subjects={subjects}
        subjectsLoading={subjectsQuery.isLoading}
        subjectsError={subjectsQuery.isError}
        durationLabel={durationLabel}
      />
      {deleteError && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {deleteError}
        </p>
      )}
      <LessonDateSchedule
        isLoading={isLoading}
        loadError={loadError}
        totalCount={totalCount}
        scheduleByDay={scheduleByDay}
        todayName={todayName}
        pendingDeleteId={pendingDeleteId}
        deletingId={deletingId}
        onPendingDelete={setPendingDeleteId}
        onEdit={handleEdit}
        onDelete={(id) => void confirmDelete(id)}
      />
    </div>
  );
}
