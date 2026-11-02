"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listAvailableStudyMonths, listStudySubjects } from "@/lib/study-table";
import type {
  GenerateStudyTableInput,
  StudyTableGenerationResult,
  StudyTableInput,
  StudyTableType,
} from "@/types/study-table";

interface CreateStudyTableDialogProps {
  onCreate: (payload: StudyTableInput) => Promise<unknown>;
  onGenerate: (
    payload: GenerateStudyTableInput,
    preview: boolean,
  ) => Promise<StudyTableGenerationResult>;
  isCreating: boolean;
}

const weekdays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const inputClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function sessionRows(
  sessions: StudyTableGenerationResult["sessions"],
  startDate?: string,
  endDate?: string,
  studyWeekdays: number[] = [],
) {
  const grouped = new Map<string, typeof sessions>();
  for (const session of sessions) grouped.set(session.date, [...(grouped.get(session.date) ?? []), session]);
  const dates = new Set(grouped.keys());
  if (startDate && endDate) {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const lastDate = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= lastDate) {
      if (studyWeekdays.includes(cursor.getUTCDay())) {
        dates.add(cursor.toISOString().slice(0, 10));
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return [...dates].sort().flatMap((date) => {
    const items = grouped.get(date) ?? [];
    if (items.length === 0) {
      return (
        <tr key={date}>
          <th className="border p-2 text-right">{formatDate(date)}</th>
          <td colSpan={2} className="border p-2 text-muted-foreground">لا توجد جلسات</td>
        </tr>
      );
    }
    return items.map((session, index) => (
      <tr key={`${date}-${session.lessonId}`}>
        {index === 0 && <th rowSpan={items.length} className="border p-2 text-right">{formatDate(date)}</th>}
        <td className="border p-2">{session.subject?.title ?? "—"}</td>
        <td className="border p-2">{session.lesson?.title ?? "—"}</td>
      </tr>
    ));
  });
}

export function CreateStudyTableDialog({
  onCreate,
  onGenerate,
  isCreating,
}: CreateStudyTableDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudyTableType>("WEEKLY");
  const [mode, setMode] = useState<"generate" | "empty">("generate");
  const [startDate, setStartDate] = useState(() => localDateString(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 13);
    return localDateString(date);
  });
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [allSubjects, setAllSubjects] = useState(true);
  const [studyWeekdays, setStudyWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(3);
  const [preview, setPreview] = useState<StudyTableGenerationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const subjectsQuery = useQuery({
    queryKey: ["study-subject-catalog"],
    queryFn: listStudySubjects,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const availableMonthsQuery = useQuery({
    queryKey: ["study-table-available-months"],
    queryFn: () => listAvailableStudyMonths(),
    enabled: open && type === "MONTHLY",
  });
  const availableMonths = availableMonthsQuery.data?.months ?? [];
  const selectedMonth = availableMonths.find(
    (option) => `${option.year}-${option.month}` === selectedMonthKey,
  ) ?? availableMonths[0];

  function invalidatePreview() {
    setPreview(null);
  }

  function getTableInput(): StudyTableInput {
    const subjects = type === "GLOBAL" ? selectedSubjects : allSubjects ? "ALL" : selectedSubjects;
    if (type === "MONTHLY") {
      if (!selectedMonth) throw new Error("لا توجد أشهر متاحة لإنشاء الجدول");
      return {
        title: title.trim(),
        type,
        month: selectedMonth.month,
        year: selectedMonth.year,
        subjects,
      };
    }
    if (type === "WEEKLY") {
      return { title: title.trim(), type, startDate, subjects };
    }
    return { title: title.trim(), type, startDate, endDate, subjects };
  }

  function getGenerationInput(): GenerateStudyTableInput {
    const subjects = type === "GLOBAL" ? selectedSubjects : allSubjects ? "ALL" : selectedSubjects;
    const schedule = { studyWeekdays, maxSessionsPerDay };
    if (type === "MONTHLY") {
      if (!selectedMonth) throw new Error("لا توجد أشهر متاحة لإنشاء الجدول");
      return {
        title: title.trim(),
        type,
        month: selectedMonth.month,
        year: selectedMonth.year,
        subjects,
        schedule,
      };
    }
    if (type === "WEEKLY") {
      return { title: title.trim(), type, startDate, subjects, schedule };
    }
    return { title: title.trim(), type, startDate, endDate, subjects, schedule };
  }

  function validateForm() {
    if (!title.trim()) {
      toast.error("أدخل عنوان الجدول");
      return false;
    }
    if ((type === "GLOBAL" || !allSubjects) && selectedSubjects.length === 0) {
      toast.error("اختر مادة واحدة على الأقل");
      return false;
    }
    if (type === "MONTHLY" && !selectedMonth) {
      toast.error(availableMonthsQuery.isError
        ? "تعذر تحميل الأشهر المتاحة"
        : "لا توجد أشهر متاحة لإنشاء الجدول");
      return false;
    }
    if (studyWeekdays.length === 0 && mode === "generate") {
      toast.error("اختر يوماً واحداً على الأقل للمذاكرة");
      return false;
    }
    return true;
  }

  async function handlePreview() {
    if (!validateForm()) return;
    setBusy(true);
    try {
      setPreview(await onGenerate(getGenerationInput(), true));
    } catch {
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    if (mode === "generate" && !preview) {
      await handlePreview();
      return;
    }
    setBusy(true);
    try {
      if (mode === "empty") await onCreate(getTableInput());
      else await onGenerate(getGenerationInput(), false);
      setOpen(false);
      setTitle("");
      setPreview(null);
    } catch {
      // Mutation error handlers display the request failure.
    } finally {
      setBusy(false);
    }
  }

  function toggleSubject(id: string) {
    setSelectedSubjects((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
    invalidatePreview();
  }

  const loading = busy || isCreating;

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setPreview(null); }}>
      <DialogTrigger render={<Button className="gap-2"><Plus className="h-4 w-4" />جدول مذاكرة جديد</Button>} />
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle className="text-center text-xl font-bold">إنشاء جدول مذاكرة</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              عنوان الجدول
              <Input value={title} maxLength={255} required onChange={(event) => { setTitle(event.target.value); invalidatePreview(); }} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              نوع الجدول
              <select className={inputClass} value={type} onChange={(event) => { setType(event.target.value as StudyTableType); invalidatePreview(); }}>
                <option value="WEEKLY">أسبوعي</option><option value="MONTHLY">شهري</option>
                <option value="CUSTOM">فترة مخصصة</option><option value="GLOBAL">خطة شاملة</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              طريقة الإنشاء
              <select className={inputClass} value={mode} onChange={(event) => { setMode(event.target.value as typeof mode); invalidatePreview(); }}>
                <option value="generate">توليد الجلسات تلقائياً</option><option value="empty">إنشاء جدول فارغ</option>
              </select>
            </label>
          </div>

          {type === "MONTHLY" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">الشهر
                <select className={inputClass}
                  value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ""}
                  disabled={availableMonthsQuery.isLoading || availableMonthsQuery.isError}
                  onChange={(event) => { setSelectedMonthKey(event.target.value); invalidatePreview(); }}>
                  {availableMonths.map((option) => <option
                    key={`${option.year}-${option.month}`}
                    value={`${option.year}-${option.month}`}>
                    {option.label}
                  </option>)}
                </select>
              </label>
              {availableMonthsQuery.isLoading && <p className="self-center text-sm text-muted-foreground">
                جارٍ تحميل الأشهر المتاحة...
              </p>}
              {availableMonthsQuery.isError && <p role="alert" className="self-center text-sm text-destructive">
                تعذر تحميل الأشهر المتاحة
              </p>}
              {selectedMonth?.isCurrent && availableMonthsQuery.data && <p className="self-center text-sm text-muted-foreground">
                سيبدأ الجدول من اليوم {availableMonthsQuery.data.today}
              </p>}
            </div>
          ) : (
            <div className={`grid gap-3 ${type === "WEEKLY" ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
              <label className="space-y-2 text-sm font-medium">تاريخ البداية
                <Input type="date" required value={startDate} onChange={(event) => { setStartDate(event.target.value); invalidatePreview(); }} />
              </label>
              {type !== "WEEKLY" && <label className="space-y-2 text-sm font-medium">تاريخ النهاية
                <Input type="date" required min={startDate} value={endDate} onChange={(event) => { setEndDate(event.target.value); invalidatePreview(); }} />
              </label>}
            </div>
          )}

          <section className="space-y-3">
            {type !== "GLOBAL" && <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={allSubjects} onCheckedChange={(checked) => { setAllSubjects(checked === true); invalidatePreview(); }} />
              جميع المواد
            </label>}
            {(type === "GLOBAL" || !allSubjects) && (
              subjectsQuery.isLoading ? <p className="text-sm text-muted-foreground">جارٍ تحميل المواد...</p> :
                subjectsQuery.isError ? <p role="alert" className="text-sm text-destructive">تعذر تحميل قائمة المواد</p> :
                  <div className="grid max-h-36 grid-cols-2 gap-2 overflow-auto rounded-md border p-3 sm:grid-cols-3">
                    {(subjectsQuery.data ?? []).map((subject) => <label key={subject.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedSubjects.includes(subject.id)} onCheckedChange={() => toggleSubject(subject.id)} />
                      {subject.title}
                    </label>)}
                  </div>
            )}
          </section>

          {mode === "generate" && <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">أيام المذاكرة</legend>
              <div className="flex flex-wrap gap-3">
                {weekdays.map((day, index) => <label key={day} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={studyWeekdays.includes(index)} onCheckedChange={() => {
                    setStudyWeekdays((current) => current.includes(index)
                      ? current.filter((value) => value !== index)
                      : [...current, index].sort());
                    invalidatePreview();
                  }} />{day}
                </label>)}
              </div>
            </fieldset>
            <label className="block max-w-xs space-y-2 text-sm font-medium">الحد الأقصى للجلسات يومياً
              <Input type="number" min={1} max={50} value={maxSessionsPerDay}
                onChange={(event) => { setMaxSessionsPerDay(Number(event.target.value)); invalidatePreview(); }} />
            </label>
          </>}

          {preview && <section className="space-y-3 rounded-md border p-3">
            {(() => {
              const eligibleDays = maxSessionsPerDay > 0
                ? preview.capacity / maxSessionsPerDay
                : 0;
              const averagePerDay = eligibleDays > 0
                ? (preview.scheduledCount / eligibleDays).toFixed(1)
                : "0.0";
              return <p className="text-sm font-semibold">
                الدروس: {preview.scheduledCount} مجدول من {preview.totalLessons}
                {preview.skippedCompletedCount > 0
                  && ` — ${preview.skippedCompletedCount} مكتمل`}
                {" — "}أيام المذاكرة: {eligibleDays}
                {" — "}المتوسط: {averagePerDay} درس يومياً
              </p>;
            })()}
            <p className="text-sm font-semibold">
              المعاينة: {preview.sessions.length} جلسة — السعة {preview.capacity}
              {preview.unscheduledLessonsCount > 0 && ` — ${preview.unscheduledLessonsCount} درس غير مجدول`}
            </p>
            {preview.suggestions.length > 0 && <ul className="list-inside list-disc text-sm text-amber-700">
              {preview.suggestions.map((suggestion) => <li key={suggestion.code}>{suggestion.message}</li>)}
            </ul>}
            {preview.months?.map((plannedMonth) => <details key={`${plannedMonth.year}-${plannedMonth.month}`} open className="space-y-2">
              <summary className="cursor-pointer font-semibold">{plannedMonth.monthName} {plannedMonth.year}</summary>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead><tr className="bg-muted"><th className="border p-2">الأسبوع</th><th className="border p-2">الأيام</th><th className="border p-2">المواد</th><th className="border p-2">الدروس</th></tr></thead>
                  <tbody>{plannedMonth.weeks.map((week) => <tr key={week.week}>
                    <th className="border p-2">الأسبوع {week.week}</th>
                    <td className="border p-2">{week.days.map((day) => formatDate(day.date)).join("، ")}</td>
                    <td className="border p-2">{week.days.flatMap((day) => day.sessions).map((session) => session.subject?.title ?? "—").join("، ")}</td>
                    <td className="border p-2">{week.days.flatMap((day) => day.sessions).map((session) => session.lesson?.title ?? "—").join("، ")}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </details>)}
            {!preview.months && <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead><tr className="bg-muted"><th className="border p-2">اليوم</th><th className="border p-2">المادة</th><th className="border p-2">الدرس</th></tr></thead>
                <tbody>{sessionRows(
                  preview.sessions,
                  preview.range?.startDate,
                  preview.range?.endDate,
                  studyWeekdays,
                )}</tbody>
              </table>
            </div>}
          </section>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || subjectsQuery.isError
                || (type === "MONTHLY" && (availableMonthsQuery.isLoading || availableMonthsQuery.isError))
                || (mode === "generate" && studyWeekdays.length === 0)}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : mode === "generate" && !preview
                  ? "معاينة الخطة"
                  : "حفظ الجدول"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
