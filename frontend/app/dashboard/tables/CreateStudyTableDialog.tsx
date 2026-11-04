"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Minus,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MainButton from "@/components/ui/MainButton";
import { Checkbox } from "@/components/ui/checkbox";
import { FormInput } from "@/components/FormInput";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import { FormDatePicker } from "@/components/FormDatePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  STUDY_TABLE_CREATION_MODE_OPTIONS,
  STUDY_TABLE_TYPE_OPTIONS,
  STUDY_TABLE_WEEKDAYS,
} from "@/constants";
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

const selectClass =
  "h-11 w-full appearance-none rounded-[var(--radius-md)] border border-input bg-background px-3 pe-10 text-sm outline-none transition-colors " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const th = "px-3 py-2.5 text-start text-xs font-medium text-muted-foreground";
const td = "border-t px-3 py-2.5 align-top";

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
          <th scope="row" className={cn(td, "whitespace-nowrap text-start font-medium")}>{formatDate(date)}</th>
          <td colSpan={2} className={cn(td, "text-muted-foreground")}>لا توجد جلسات</td>
        </tr>
      );
    }
    return items.map((session, index) => (
      <tr key={`${date}-${session.lessonId}`}>
        {index === 0 && (
          <th
            scope="row"
            rowSpan={items.length}
            className={cn(td, "whitespace-nowrap border-e bg-muted/30 text-start font-medium")}
          >
            {formatDate(date)}
          </th>
        )}
        <td className={td}>{session.subject?.title ?? "—"}</td>
        <td className={td}>{session.lesson?.title ?? "—"}</td>
      </tr>
    ));
  });
}

/** A titled group of fields with a quiet container. */
function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg,0.75rem)] border bg-muted/20 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Pressable chip used for weekdays and subjects. */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-muted",
      )}
    >
      {selected && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
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
    if (
      type !== "MONTHLY" &&
      (!startDate || (type !== "WEEKLY" && (!endDate || endDate < startDate)))
    ) {
      toast.error("تحقق من تاريخ بداية ونهاية الجدول");
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

  function toggleWeekday(index: number) {
    setStudyWeekdays((current) => current.includes(index)
      ? current.filter((value) => value !== index)
      : [...current, index].sort());
    invalidatePreview();
  }

  function changeSessions(next: number) {
    setMaxSessionsPerDay(Math.min(50, Math.max(1, next || 1)));
    invalidatePreview();
  }

  const loading = busy || isCreating;
  const submitDisabled =
    subjectsQuery.isError ||
    (type === "MONTHLY" && (availableMonthsQuery.isLoading || availableMonthsQuery.isError)) ||
    (mode === "generate" && studyWeekdays.length === 0);
  const showSubjectList = type === "GLOBAL" || !allSubjects;

  const eligibleDays = preview && maxSessionsPerDay > 0 ? preview.capacity / maxSessionsPerDay : 0;
  const averagePerDay = preview && eligibleDays > 0
    ? (preview.scheduledCount / eligibleDays).toFixed(1)
    : "0.0";

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setPreview(null); }}>
      <DialogTrigger render={<MainButton icon={<Plus />} title="جدول مذاكرة جديد" />} />
      <DialogContent
        dir="rtl"
        closeButtonClassName="right-auto left-2"
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader className="pb-4 text-start">
          <DialogTitle className="text-xl font-bold">إنشاء جدول مذاكرة</DialogTitle>
          <DialogDescription>
            حدّد الفترة والمواد وأيام المذاكرة، وراجع الخطة قبل حفظها.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Section title="الأساسيات">
            <div className="grid gap-3 sm:grid-cols-3">
              <FormInput
                label="عنوان الجدول"
                value={title}
                maxLength={255}
                required
                onChange={(event) => {
                  setTitle(event.target.value);
                  invalidatePreview();
                }}
              />
              <FormCustomSelect
                label="نوع الجدول"
                value={type}
                onChange={(value) => {
                  setType(value);
                  invalidatePreview();
                }}
                options={STUDY_TABLE_TYPE_OPTIONS}
              />
              <FormCustomSelect
                label="طريقة الإنشاء"
                value={mode}
                onChange={(value) => {
                  setMode(value);
                  invalidatePreview();
                }}
                options={STUDY_TABLE_CREATION_MODE_OPTIONS}
              />
            </div>
          </Section>

          <Section title="الفترة">
            {type === "MONTHLY" ? (
              <div className="grid items-end gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  الشهر
                  <span className="relative block">
                    <select
                      className={selectClass}
                      value={selectedMonth ? `${selectedMonth.year}-${selectedMonth.month}` : ""}
                      disabled={availableMonthsQuery.isLoading || availableMonthsQuery.isError}
                      onChange={(event) => { setSelectedMonthKey(event.target.value); invalidatePreview(); }}
                    >
                      {availableMonths.map((option) => (
                        <option key={`${option.year}-${option.month}`} value={`${option.year}-${option.month}`}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                  </span>
                </label>
                {availableMonthsQuery.isLoading && (
                  <p className="pb-3 text-sm text-muted-foreground">جارٍ تحميل الأشهر المتاحة...</p>
                )}
                {availableMonthsQuery.isError && (
                  <p role="alert" className="pb-3 text-sm text-destructive">تعذر تحميل الأشهر المتاحة</p>
                )}
                {selectedMonth?.isCurrent && availableMonthsQuery.data && (
                  <p className="flex items-center gap-1.5 pb-3 text-sm text-muted-foreground">
                    <CalendarDays className="size-4 shrink-0" aria-hidden />
                    سيبدأ الجدول من اليوم {availableMonthsQuery.data.today}
                  </p>
                )}
              </div>
            ) : (
              <div className={cn("grid gap-3", type === "WEEKLY" ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
                <FormDatePicker
                  label="تاريخ البداية"
                  value={startDate}
                  required
                  onChange={(value) => {
                    setStartDate(value);
                    if (endDate < value) setEndDate(value);
                    invalidatePreview();
                  }}
                />
                {type !== "WEEKLY" && (
                  <FormDatePicker
                    label="تاريخ النهاية"
                    value={endDate}
                    minDate={startDate}
                    required
                    onChange={(value) => {
                      setEndDate(value);
                      invalidatePreview();
                    }}
                  />
                )}
              </div>
            )}
          </Section>

          <Section
            title="المواد"
            hint={showSubjectList && selectedSubjects.length > 0
              ? `${selectedSubjects.length} مادة مختارة`
              : undefined}
            action={type !== "GLOBAL" ? (
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allSubjects}
                  onCheckedChange={(checked) => { setAllSubjects(checked === true); invalidatePreview(); }}
                />
                جميع المواد
              </label>
            ) : undefined}
          >
            {!showSubjectList ? (
              <p className="text-sm text-muted-foreground">سيتم تضمين كل المواد في الجدول.</p>
            ) : subjectsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">جارٍ تحميل المواد...</p>
            ) : subjectsQuery.isError ? (
              <p role="alert" className="text-sm text-destructive">تعذر تحميل قائمة المواد</p>
            ) : (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {(subjectsQuery.data ?? []).map((subject) => (
                  <Chip
                    key={subject.id}
                    selected={selectedSubjects.includes(subject.id)}
                    onClick={() => toggleSubject(subject.id)}
                  >
                    {subject.title}
                  </Chip>
                ))}
              </div>
            )}
          </Section>

          {mode === "generate" && (
            <Section title="جدولة المذاكرة">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">أيام المذاكرة</legend>
                <div className="flex flex-wrap gap-2">
                  {STUDY_TABLE_WEEKDAYS.map((day, index) => (
                    <Chip key={day} selected={studyWeekdays.includes(index)} onClick={() => toggleWeekday(index)}>
                      {day}
                    </Chip>
                  ))}
                </div>
                {studyWeekdays.length === 0 && (
                  <p role="alert" className="text-xs text-destructive">اختر يوماً واحداً على الأقل.</p>
                )}
              </fieldset>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                <div>
                  <p id="sessions-label" className="text-sm font-medium">الحد الأقصى للجلسات يومياً</p>
                  <p className="text-xs text-muted-foreground">من 1 إلى 6 جلسة</p>
                </div>
                <div
                  role="group"
                  aria-labelledby="sessions-label"
                  className="flex h-11 items-center rounded-[var(--radius-md)] border bg-background"
                >
                  <button
                    type="button"
                    aria-label="تقليل"
                    disabled={maxSessionsPerDay <= 1}
                    onClick={() => changeSessions(maxSessionsPerDay - 1)}
                    className="grid size-11 place-items-center rounded-s-[var(--radius-md)] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={50}
                    value={maxSessionsPerDay}
                    onChange={(event) => changeSessions(Number(event.target.value))}
                    className="h-full w-14 bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label="زيادة"
                    disabled={maxSessionsPerDay >= 50}
                    onClick={() => changeSessions(maxSessionsPerDay + 1)}
                    className="grid size-11 place-items-center rounded-e-[var(--radius-md)] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </Section>
          )}

          {preview && (
            <Section title="معاينة الخطة">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="دروس مجدولة" value={`${preview.scheduledCount} / ${preview.totalLessons}`} />
                <Stat label="أيام المذاكرة" value={eligibleDays} />
                <Stat label="المتوسط اليومي" value={averagePerDay} />
                <Stat label="السعة" value={preview.capacity} />
              </div>

              {(preview.skippedCompletedCount > 0 || preview.unscheduledLessonsCount > 0) && (
                <p className="text-sm text-muted-foreground">
                  {preview.skippedCompletedCount > 0 && `${preview.skippedCompletedCount} درس مكتمل تم تخطيه`}
                  {preview.skippedCompletedCount > 0 && preview.unscheduledLessonsCount > 0 && " — "}
                  {preview.unscheduledLessonsCount > 0 && `${preview.unscheduledLessonsCount} درس غير مجدول`}
                </p>
              )}

              {preview.suggestions.length > 0 && (
                <div
                  role="status"
                  className="flex gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <ul className="space-y-1">
                    {preview.suggestions.map((suggestion) => (
                      <li key={suggestion.code}>{suggestion.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.months?.map((plannedMonth) => (
                <details
                  key={`${plannedMonth.year}-${plannedMonth.month}`}
                  open
                  className="group space-y-2"
                >
                  <summary className="cursor-pointer text-sm font-semibold marker:text-muted-foreground">
                    {plannedMonth.monthName} {plannedMonth.year}
                  </summary>
                  <div className="overflow-x-auto rounded-lg border bg-background">
                    <table className="w-full min-w-[600px] border-collapse text-sm">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className={th}>الأسبوع</th>
                          <th className={th}>الأيام</th>
                          <th className={th}>المواد</th>
                          <th className={th}>الدروس</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plannedMonth.weeks.map((week) => (
                          <tr key={week.week}>
                            <th scope="row" className={cn(td, "whitespace-nowrap text-start font-medium")}>
                              الأسبوع {week.week}
                            </th>
                            <td className={td}>{week.days.map((day) => formatDate(day.date)).join("، ")}</td>
                            <td className={td}>
                              {week.days.flatMap((day) => day.sessions).map((session) => session.subject?.title ?? "—").join("، ")}
                            </td>
                            <td className={td}>
                              {week.days.flatMap((day) => day.sessions).map((session) => session.lesson?.title ?? "—").join("، ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}

              {!preview.months && (
                <div className="max-h-72 overflow-auto rounded-lg border bg-background">
                  <table className="w-full min-w-[640px] border-collapse text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className={th}>اليوم</th>
                        <th className={th}>المادة</th>
                        <th className={th}>الدرس</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRows(
                        preview.sessions,
                        preview.range?.startDate,
                        preview.range?.endDate,
                        studyWeekdays,
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          <div className="sticky bottom-0 -mx-1 border-t bg-background/95 px-1 pb-1 pt-3 backdrop-blur">
            <MainButton
              type="submit"
              fullWidth
              loading={loading}
              loadingTitle={mode === "generate" && !preview ? "جارٍ إعداد المعاينة…" : "جارٍ الحفظ…"}
              disabled={submitDisabled}
              title={mode === "generate" && !preview ? "معاينة الخطة" : "حفظ الجدول"}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}