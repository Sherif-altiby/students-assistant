"use client";

import { useEffect, useState } from "react";
import { CalendarDays, PencilLine, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/PageHeader";

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
            <div className="space-y-2">
              <Label htmlFor="from-date" className="text-sm font-medium text-foreground">
                من
              </Label>
              <Input
                id="from-date"
                type="date"
                value={form.fromDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, fromDate: event.target.value }))
                }
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-date" className="text-sm font-medium text-foreground">
                إلى
              </Label>
              <Input
                id="to-date"
                type="date"
                value={form.toDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, toDate: event.target.value }))
                }
                className="h-11"
              />
            </div>
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
