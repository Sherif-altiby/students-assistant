"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  User2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ARABIC_DAYS_ORDERED } from "@/lib/day-mapping";
import type { LessonDate } from "@/types/lesson-date";
import { useLessonDates } from "@/hooks/useLessonDates";

const emptyForm = {
  subject: "",
  teacher: "",
  dayName: "",
  startTime: "",
  endTime: "",
};

// A day's identity is structural information here, not decoration — each
// column of the weekly schedule needs to read as "its own day" at a glance.
// Kept to a single accent per day, used consistently (dot + top border).
const DAY_STYLES: Record<string, { dot: string; edge: string }> = {
  الأحد: { dot: "bg-sky-500", edge: "border-t-sky-500" },
  الإثنين: { dot: "bg-violet-500", edge: "border-t-violet-500" },
  الثلاثاء: { dot: "bg-amber-500", edge: "border-t-amber-500" },
  الأربعاء: { dot: "bg-emerald-500", edge: "border-t-emerald-500" },
  الخميس: { dot: "bg-rose-500", edge: "border-t-rose-500" },
  الجمعة: { dot: "bg-indigo-500", edge: "border-t-indigo-500" },
  السبت: { dot: "bg-teal-500", edge: "border-t-teal-500" },
};

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

/** "1 ساعة و 30 دقيقة" style duration label, or null while the range is invalid/incomplete. */
function formatDuration(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return null;
  const diff = toMinutes(endTime) - toMinutes(startTime);
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "ساعة" : "ساعات"}`);
  if (minutes > 0) parts.push(`${minutes} دقيقة`);
  return parts.length ? parts.join(" و ") : null;
}

export default function LessonDatesPage() {
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

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const scheduleByDay = useMemo(() => {
    const grouped = new Map<string, LessonDate[]>();
    for (const day of ARABIC_DAYS_ORDERED) grouped.set(day, []);

    for (const entry of lessonDates) {
      const list = grouped.get(entry.dayName) ?? [];
      list.push(entry);
      grouped.set(entry.dayName, list);
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
    }

    return grouped;
  }, [lessonDates]);

  const todayName = ARABIC_DAYS_ORDERED[new Date().getDay()];

  // Walks forward from "now" through the week to find the very next lesson —
  // remaining lessons today first, then the earliest lesson on the next day
  // that has any, wrapping around after Saturday.
  const nextLesson = useMemo(() => {
    if (lessonDates.length === 0) return null;

    const now = new Date();
    const todayIndex = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let offset = 0; offset < 7; offset++) {
      const dayIndex = (todayIndex + offset) % 7;
      const dayName = ARABIC_DAYS_ORDERED[dayIndex];
      const items = (scheduleByDay.get(dayName) ?? []).filter((item) =>
        offset === 0 ? toMinutes(item.startTime) > nowMinutes : true
      );
      if (items.length > 0) {
        return { ...items[0], dayName, isToday: offset === 0 };
      }
    }
    return null;
  }, [lessonDates, scheduleByDay]);

  const durationLabel = useMemo(
    () => formatDuration(form.startTime, form.endTime),
    [form.startTime, form.endTime]
  );

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const subject = form.subject.trim();
    const teacher = form.teacher.trim();
    const dayName = form.dayName;
    const { startTime, endTime } = form;

    if (!subject || !teacher || !dayName || !startTime || !endTime) {
      setFormError("الرجاء إدخال جميع الحقول (المادة، المعلم، اليوم، الوقت).");
      return;
    }

    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setFormError("وقت النهاية يجب أن يكون بعد وقت البداية.");
      return;
    }

    // Fast client-side check for instant feedback. The server re-validates
    // this authoritatively, so a race with another tab/device is still caught.
    const conflict = lessonDates.find(
      (e) =>
        e.dayName === dayName &&
        e.id !== editingId &&
        overlaps(startTime, endTime, e.startTime, e.endTime)
    );
    if (conflict) {
      setFormError(
        `يتعارض هذا الموعد مع "${conflict.subject}" (${conflict.startTime} - ${conflict.endTime}) في نفس اليوم.`
      );
      return;
    }

    setFormError("");

    try {
      await saveLessonDate({ subject, teacher, dayName, startTime, endTime }, editingId);
      resetForm();
    } catch (err) {
      setFormError(extractErrorMessage(err, "حدث خطأ أثناء الحفظ."));
    }
  }

  function handleEdit(item: LessonDate) {
    setEditingId(item.id);
    setForm({
      subject: item.subject,
      teacher: item.teacher,
      dayName: item.dayName,
      startTime: item.startTime,
      endTime: item.endTime,
    });
    setFormError("");
  }

  async function confirmDelete(id: string) {
    setDeleteError("");
    try {
      await deleteLessonDate(id);
      if (editingId === id) resetForm();
      setPendingDeleteId(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "تعذر حذف الموعد."));
    }
  }

  const totalCount = lessonDates.length;
  const activeDaysCount = useMemo(
    () => Array.from(scheduleByDay.values()).filter((list) => list.length > 0).length,
    [scheduleByDay]
  );
  const todayCount = (scheduleByDay.get(todayName) ?? []).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="مواعيد الدروس"
        description="تابع جدولك الأسبوعي، وأضف أو حدّث أو احذف مواعيدك بسهولة."
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => downloadLessonDatesPdf()}
          disabled={isLoading || lessonDates.length === 0}
        >
          <CalendarDays className="h-4 w-4" />
          تحميل PDF
        </Button>
      </div>

      {!isLoading && !loadError && nextLesson && (
        <Card className="flex items-center gap-4 border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary">
              {nextLesson.isToday ? "الحصة القادمة اليوم" : `الحصة القادمة — ${nextLesson.dayName}`}
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-foreground">
              {nextLesson.subject} <span className="font-normal text-muted-foreground">مع {nextLesson.teacher}</span>
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold tabular-nums text-primary">
            {nextLesson.startTime}
          </span>
        </Card>
      )}

      <Card className="border border-border bg-card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingId ? (
              <PencilLine className="h-4 w-4 text-primary" />
            ) : (
              <Plus className="h-4 w-4 text-primary" />
            )}
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "تعديل الموعد" : "إضافة موعد جديد"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70"
            >
              <X className="h-3 w-3" />
              إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                المادة
              </Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))}
                placeholder="مثال: رياضيات"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User2 className="h-3.5 w-3.5 text-muted-foreground" />
                المعلم
              </Label>
              <Input
                value={form.teacher}
                onChange={(e) => setForm((c) => ({ ...c, teacher: e.target.value }))}
                placeholder="مثال: محمود"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                اليوم
              </Label>
              <Select
                value={form.dayName}
                onValueChange={(value) => setForm((c) => ({ ...c, dayName: value ?? "" }))}
              >
                <SelectTrigger className="w-full text-right">
                  <SelectValue placeholder="اختر اليوم" />
                </SelectTrigger>
                <SelectContent>
                  {ARABIC_DAYS_ORDERED.map((day) => (
                    <SelectItem key={day} value={day} className="text-right">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${DAY_STYLES[day]?.dot}`} />
                        {day}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time range: paired inputs with a directional connector and a
                live duration chip, so the relationship between the two times
                reads as one unit rather than two unrelated fields. */}
            <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/30 p-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>الوقت</span>
                </div>
                {durationLabel && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {durationLabel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">من</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((c) => ({ ...c, startTime: e.target.value }))}
                    className="tabular-nums"
                  />
                </div>

                <ArrowLeft className="mb-3 h-4 w-4 shrink-0 text-muted-foreground" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">إلى</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((c) => ({ ...c, endTime: e.target.value }))}
                    className="tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {formError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="gap-2" disabled={isSaving}>
              {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isSaving ? "جارِ الحفظ..." : editingId ? "تحديث الموعد" : "إضافة موعد"}
            </Button>

            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                إلغاء
              </Button>
            )}
          </div>
        </form>
      </Card>

      {!isLoading && !loadError && totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="flex flex-col items-center gap-1 border border-border bg-card p-4 text-center">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold tabular-nums text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground">إجمالي المواعيد</span>
          </Card>
          <Card className="flex flex-col items-center gap-1 border border-border bg-card p-4 text-center">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold tabular-nums text-foreground">{activeDaysCount}</span>
            <span className="text-xs text-muted-foreground">أيام نشطة</span>
          </Card>
          <Card className="flex flex-col items-center gap-1 border border-border bg-card p-4 text-center">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xl font-bold tabular-nums text-foreground">{todayCount}</span>
            <span className="text-xs text-muted-foreground">حصص اليوم</span>
          </Card>
        </div>
      )}

      {deleteError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {deleteError}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse border border-border bg-card" />
          ))}
        </div>
      ) : loadError ? (
        <Card className="flex flex-col items-center justify-center gap-2 border border-dashed border-red-200 bg-red-50/40 py-16 text-center">
          <p className="text-base font-medium text-red-600">{loadError}</p>
        </Card>
      ) : totalCount === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">لا توجد مواعيد دروس بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">أضف أول موعد دراسي من النموذج أعلاه.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {ARABIC_DAYS_ORDERED.filter((day) => (scheduleByDay.get(day) ?? []).length > 0).map(
            (day) => {
              const items = scheduleByDay.get(day) ?? [];
              const isToday = day === todayName;
              const style = DAY_STYLES[day];

              return (
                <div key={day} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${style?.dot}`} />
                    <h3 className="text-base font-semibold text-foreground">{day}</h3>
                    {isToday && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        اليوم
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      ({items.length} {items.length === 1 ? "موعد" : "مواعيد"})
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className={`border border-border border-t-4 bg-card p-4 transition-shadow hover:shadow-md ${style?.edge}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-foreground">
                              {item.subject}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <User2 className="h-3.5 w-3.5" />
                              {item.teacher}
                            </p>
                          </div>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium tabular-nums text-primary">
                              <Clock className="h-3 w-3" />
                              {item.startTime} - {item.endTime}
                            </span>
                            {(() => {
                              const duration = formatDuration(item.startTime, item.endTime);
                              return duration ? (
                                <span className="text-[11px] text-muted-foreground">
                                  {duration}
                                </span>
                              ) : null;
                            })()}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-end gap-2">
                          {pendingDeleteId === item.id ? (
                            <>
                              <span className="ml-auto text-sm text-muted-foreground">
                                تأكيد الحذف؟
                              </span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => confirmDelete(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? "جارِ الحذف..." : "حذف"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setPendingDeleteId(null)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="gap-2"
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                تعديل
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setPendingDeleteId(item.id)}
                                className="gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                حذف
                              </Button>
                            </>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}