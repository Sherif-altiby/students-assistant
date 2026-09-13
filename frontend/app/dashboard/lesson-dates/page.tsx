"use client";

import { useEffect, useState } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { arSA } from "date-fns/locale";
import { CalendarDays, CalendarIcon, PencilLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/PageHeader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type LessonDate = {
  id: string;
  title: string;
  fromDate: string;
  toDate: string;
};

const STORAGE_KEY = "lesson-dates";

const emptyForm = {
  title: "",
  fromDate: "",
  toDate: "",
};

function formatArabicDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getDayName(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
  }).format(new Date(`${value}T00:00:00`));
}

function getDateValue(dateValue: string | undefined) {
  return dateValue ? new Date(`${dateValue}T00:00:00`) : undefined;
}

function FieldDatePicker({
  label,
  value,
  onChange,
  minDate,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  placeholder: string;
}) {
  const selectedValue = getDateValue(value);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Popover>
        <PopoverTrigger>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-between rounded-xl border-border/70 bg-muted/30 px-3 font-normal text-foreground"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {value ? format(parseISO(value), "PPP", { locale: arSA }) : placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-2xl border-border/50 p-0 shadow-xl" align="start">
          <Calendar
            mode="single"
            selected={selectedValue}
            onSelect={onChange}
            locale={arSA}
            className="p-1"
            disabled={(date) => {
              if (date < startOfDay(new Date())) return true;
              if (minDate && date < startOfDay(minDate)) return true;
              return false;
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function LessonDatesPage() {
  const [entries, setEntries] = useState<LessonDate[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LessonDate[];
      if (Array.isArray(parsed)) setEntries(parsed);
    } catch {
      setEntries([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();

    if (!title || !form.fromDate || !form.toDate) {
      setError("الرجاء إدخال عنوان وموعد البداية والنهاية.");
      return;
    }

    if (new Date(form.toDate) < new Date(form.fromDate)) {
      setError("تاريخ النهاية يجب أن يكون بعد أو مساوياً لتاريخ البداية.");
      return;
    }

    if (editingId) {
      setEntries((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, title, fromDate: form.fromDate, toDate: form.toDate }
            : item,
        ),
      );
    } else {
      setEntries((current) => [
        {
          id: crypto.randomUUID(),
          title,
          fromDate: form.fromDate,
          toDate: form.toDate,
        },
        ...current,
      ]);
    }

    resetForm();
  }

  function handleEdit(item: LessonDate) {
    setEditingId(item.id);
    setForm({ title: item.title, fromDate: item.fromDate, toDate: item.toDate });
    setError("");
  }

  function handleDelete(id: string) {
    setEntries((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
  }

  function handleDateChange(field: "fromDate" | "toDate") {
    return (date: Date | undefined) => {
      if (!date) return;

      setForm((current) => ({
        ...current,
        [field]: format(date, "yyyy-MM-dd"),
      }));
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مواعيد الدروس"
        description="تابع كل موعد دراسي، وأضف أو حدّث أو احذف مواعيدك بسهولة."
      />

      <Card className="border border-border bg-card p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="lesson-title" className="text-sm font-medium text-foreground">
              عنوان الدرس
            </Label>
            <Input
              id="lesson-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="مثال: رياضيات - مراجعة الفصول"
              className="h-11"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldDatePicker
              label="من"
              value={form.fromDate}
              onChange={handleDateChange("fromDate")}
              placeholder="اختر تاريخ البداية"
            />

            <FieldDatePicker
              label="إلى"
              value={form.toDate}
              onChange={handleDateChange("toDate")}
              minDate={form.fromDate ? getDateValue(form.fromDate) : undefined}
              placeholder="اختر تاريخ النهاية"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="gap-2">
              {editingId ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? "تحديث الموعد" : "إضافة موعد"}
            </Button>

            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                إلغاء
              </Button>
            )}
          </div>
        </form>
      </Card>

      {entries.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 border border-dashed border-border bg-card py-16 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="text-base font-medium text-foreground">لا توجد مواعيد دروس بعد</p>
          <p className="text-sm text-muted-foreground">
            أضف أول موعد دراسي من النموذج أعلاه.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((item) => (
            <Card key={item.id} className="border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-primary">
                    {getDayName(item.fromDate)}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                  {item.fromDate === item.toDate ? "يوم واحد" : "عدة أيام"}
                </span>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">من</span>
                  <span className="font-medium text-foreground">{formatArabicDate(item.fromDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">إلى</span>
                  <span className="font-medium text-foreground">{formatArabicDate(item.toDate)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
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
                  onClick={() => handleDelete(item.id)}
                  className="gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
