"use client";

import type { FormEvent, Dispatch, SetStateAction } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  GraduationCap,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  User2,
  X,
} from "lucide-react";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ARABIC_DAYS_ORDERED } from "@/lib/day-mapping";
import type { LessonDate } from "@/types/lesson-date";
import type { StudySubjectSummary } from "@/types/study-table";

export interface LessonDateFormValues {
  subject: string;
  teacher: string;
  dayNames: string[];
  startTime: string;
  endTime: string;
}

type NextLesson = LessonDate & { isToday: boolean };
const WEEK_TABLE_DAYS = [
  "السبت",
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const DAY_STYLES: Record<
  string,
  { dot: string; chip: string; chipActive: string; ring: string }
> = {
  الأحد: {
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 hover:bg-sky-100",
    chipActive: "bg-sky-500 text-white hover:bg-sky-500",
    ring: "ring-sky-500/30",
  },
  الإثنين: {
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    chipActive: "bg-violet-500 text-white hover:bg-violet-500",
    ring: "ring-violet-500/30",
  },
  الثلاثاء: {
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    chipActive: "bg-amber-500 text-white hover:bg-amber-500",
    ring: "ring-amber-500/30",
  },
  الأربعاء: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    chipActive: "bg-emerald-500 text-white hover:bg-emerald-500",
    ring: "ring-emerald-500/30",
  },
  الخميس: {
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    chipActive: "bg-rose-500 text-white hover:bg-rose-500",
    ring: "ring-rose-500/30",
  },
  الجمعة: {
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    chipActive: "bg-indigo-500 text-white hover:bg-indigo-500",
    ring: "ring-indigo-500/30",
  },
  السبت: {
    dot: "bg-teal-500",
    chip: "bg-teal-50 text-teal-700 hover:bg-teal-100",
    chipActive: "bg-teal-500 text-white hover:bg-teal-500",
    ring: "ring-teal-500/30",
  },
};

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatDuration(
  startTime: string,
  endTime: string,
): string | null {
  if (!startTime || !endTime) return null;
  const minutesTotal = toMinutes(endTime) - toMinutes(startTime);
  if (minutesTotal <= 0) return null;
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  return [
    ...(hours > 0 ? [`${hours} ${hours === 1 ? "ساعة" : "ساعات"}`] : []),
    ...(minutes > 0 ? [`${minutes} دقيقة`] : []),
  ].join(" و ");
}

export function LessonDateOverview({
  totalCount,
  activeDaysCount,
  todayCount,
  nextLesson,
  showStats,
  pdfDisabled,
  onDownloadPdf,
}: {
  totalCount: number;
  activeDaysCount: number;
  todayCount: number;
  nextLesson: NextLesson | null;
  showStats: boolean;
  pdfDisabled: boolean;
  onDownloadPdf: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>
            {totalCount > 0
              ? `${totalCount} موعد موزّع على ${activeDaysCount} من الأيام`
              : "ابدأ بإضافة مواعيدك الأسبوعية"}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={onDownloadPdf}
          disabled={pdfDisabled}
        >
          <CalendarDays className="h-4 w-4" />
          تحميل PDF
        </Button>
      </div>

      {nextLesson && (
        <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent p-5">
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {nextLesson.isToday
                  ? "الحصة القادمة اليوم"
                  : `الحصة القادمة — ${nextLesson.dayName}`}
              </p>
              <p className="mt-1 truncate text-lg font-bold text-foreground">
                {nextLesson.subject}
                <span className="ms-2 text-sm font-normal text-muted-foreground">
                  مع {nextLesson.teacher}
                </span>
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold tabular-nums text-primary-foreground shadow-sm">
                {nextLesson.startTime}
              </span>
              {formatDuration(nextLesson.startTime, nextLesson.endTime) && (
                <span className="text-[11px] text-muted-foreground">
                  {formatDuration(nextLesson.startTime, nextLesson.endTime)}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {showStats && totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <OverviewStat
            icon={<CalendarClock />}
            value={totalCount}
            label="إجمالي المواعيد"
          />
          <OverviewStat
            icon={<CalendarDays />}
            value={activeDaysCount}
            label="أيام نشطة"
            color="emerald"
          />
          <OverviewStat
            icon={<Sparkles />}
            value={todayCount}
            label="حصص اليوم"
            color="amber"
          />
        </div>
      )}
    </>
  );
}

function OverviewStat({
  icon,
  value,
  label,
  color = "primary",
}: {
  icon: import("react").ReactNode;
  value: number;
  label: string;
  color?: "primary" | "emerald" | "amber";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
  };
  return (
    <Card className="flex items-center gap-3 border border-border bg-card p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

export function LessonDateForm({
  form,
  setForm,
  editing,
  onSubmit,
  onReset,
  isSaving,
  formError,
  subjects,
  subjectsLoading,
  subjectsError,
  durationLabel,
}: {
  form: LessonDateFormValues;
  setForm: Dispatch<SetStateAction<LessonDateFormValues>>;
  editing: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  isSaving: boolean;
  formError: string;
  subjects: StudySubjectSummary[];
  subjectsLoading: boolean;
  subjectsError: boolean;
  durationLabel: string | null;
}) {
  return (
    <Card className="border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${editing ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"}`}
          >
            {editing ? (
              <PencilLine className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {editing ? "تعديل الموعد" : "إضافة موعد جديد"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editing
                ? "قم بتحديث بيانات الموعد ثم اضغط تحديث."
                : "املأ الحقول لإضافة موعد إلى جدولك."}
            </p>
          </div>
        </div>
        {editing && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <X className="h-3 w-3" />
            إلغاء التعديل
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="lesson-date-subject"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              المادة
            </Label>
            <CustomSelect
              id="lesson-date-subject"
              value={form.subject}
              onChange={(subject) =>
                setForm((current) => ({ ...current, subject }))
              }
              disabled={subjectsLoading || subjectsError}
              placeholder={
                subjectsLoading
                  ? "جارٍ تحميل المواد..."
                  : subjectsError
                    ? "تعذر تحميل المواد"
                    : subjects.length
                      ? "اختر المادة"
                      : "لا توجد مواد متاحة"
              }
              options={[
                ...(editing &&
                form.subject &&
                !subjects.some((item) => item.title === form.subject)
                  ? [
                      {
                        value: form.subject,
                        label: `${form.subject} (المادة الحالية)`,
                      },
                    ]
                  : []),
                ...subjects.map((item) => ({
                  value: item.title,
                  label: item.title,
                })),
              ]}
            />
            {subjectsError && (
              <p role="alert" className="text-xs text-destructive">
                تعذر تحميل موادك الدراسية. أعد المحاولة قبل إضافة موعد.
              </p>
            )}
            {!subjectsError && !subjectsLoading && subjects.length === 0 && (
              <p className="text-xs text-muted-foreground">
                لا توجد مواد متاحة لحسابك حالياً.
              </p>
            )}
          </div>

          <FormInput
            label="المعلم"
            value={form.teacher}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                teacher: event.target.value,
              }))
            }
            placeholder="مثال: محمود"
            maxLength={255}
            startIcon={<User2 />}
          />

          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              الأيام
            </Label>
            {!editing && (
              <p className="text-xs text-muted-foreground">
                يمكنك اختيار أكثر من يوم لتكرار هذا الموعد أسبوعياً.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {ARABIC_DAYS_ORDERED.map((day) => {
                const style = DAY_STYLES[day];
                const active = form.dayNames.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        dayNames: editing
                          ? [day]
                          : active
                            ? current.dayNames.filter(
                                (selected) => selected !== day,
                              )
                            : [...current.dayNames, day],
                      }))
                    }
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${active ? `${style.chipActive} shadow-sm ring-2 ${style.ring}` : `${style.chip} ring-1 ring-transparent`}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : style.dot}`}
                    />
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <span>الوقت</span>
              </div>
              {durationLabel && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {durationLabel}
                </span>
              )}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <TimeInput
                label="من"
                value={form.startTime}
                onChange={(startTime) =>
                  setForm((current) => ({ ...current, startTime }))
                }
              />
              <div className="mb-3 flex flex-col items-center gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <TimeInput
                label="إلى"
                value={form.endTime}
                onChange={(endTime) =>
                  setForm((current) => ({ ...current, endTime }))
                }
              />
            </div>
          </div>
        </div>

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {formError}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="gap-2" disabled={isSaving}>
            {editing ? (
              <PencilLine className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isSaving
              ? "جارِ الحفظ..."
              : editing
                ? "تحديث الموعد"
                : "إضافة موعد"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={isSaving}
            >
              إلغاء
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="tabular-nums"
      />
    </div>
  );
}

export function LessonDateSchedule({
  isLoading,
  loadError,
  totalCount,
  scheduleByDay,
  todayName,
  pendingDeleteId,
  deletingId,
  onPendingDelete,
  onEdit,
  onDelete,
}: {
  isLoading: boolean;
  loadError: string | null;
  totalCount: number;
  scheduleByDay: Map<string, LessonDate[]>;
  todayName: string;
  pendingDeleteId: string | null;
  deletingId: string | null;
  onPendingDelete: (id: string | null) => void;
  onEdit: (item: LessonDate) => void;
  onDelete: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card
            key={index}
            className="h-36 animate-pulse border border-border bg-card"
          />
        ))}
      </div>
    );
  }
  if (loadError) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 border border-dashed border-red-200 bg-red-50/40 py-16 text-center">
        <p className="text-base font-medium text-red-600">{loadError}</p>
      </Card>
    );
  }
  if (totalCount === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-base font-medium text-foreground">
            لا توجد مواعيد دروس بعد
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            أضف أول موعد دراسي من النموذج أعلاه.
          </p>
        </div>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden p-0">
      <Table className="min-w-[760px] text-right">
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead className="text-right">اليوم</TableHead>
            <TableHead className="text-right">الوقت</TableHead>
            <TableHead className="text-right">المادة</TableHead>
            <TableHead className="text-right">المعلم</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {WEEK_TABLE_DAYS.map((day) => {
            const items = scheduleByDay.get(day) ?? [];
            const style = DAY_STYLES[day];
            return (
              <TableRow key={day}>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className={`h-2 w-2 rounded-full ${style?.dot}`} />
                    {day}
                    {day === todayName && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        اليوم
                      </span>
                    )}
                  </span>
                </TableCell>
                {(["time", "subject", "teacher"] as const).map((field) => (
                  <TableCell
                    key={field}
                    className={field === "subject" ? "font-semibold" : ""}
                  >
                    {items.length ? (
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="min-h-7">
                            {field === "time" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-primary">
                                <Clock className="h-3 w-3" />
                                {item.startTime} - {item.endTime}
                              </span>
                            ) : field === "subject" ? (
                              item.subject
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                <User2 className="h-3.5 w-3.5" />
                                {item.teacher}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {items.length ? (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex min-h-7 items-center gap-1"
                        >
                          {pendingDeleteId === item.id ? (
                            <>
                              <span className="text-xs text-muted-foreground">
                                تأكيد الحذف؟
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onPendingDelete(null)}
                              >
                                إلغاء
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id
                                  ? "جارِ الحذف..."
                                  : "حذف"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                تعديل
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onPendingDelete(item.id)}
                                className="gap-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                حذف
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
