"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Flame } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { createHabit, deleteHabit, listHabits, updateHabit } from "@/lib/habits";
import type { Habit, HabitFrequency } from "@/types";
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "DAILY", label: "يوميًا" },
  { value: "WEEKLY", label: "أسبوعيًا" },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<HabitFrequency>("DAILY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listHabits()
      .then(setHabits)
      .catch(() => setError("تعذر تحميل العادات"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const habit = await createHabit({ title: title.trim(), frequency });
      setHabits((prev) => [habit, ...prev]);
      setTitle("");
      setFrequency("DAILY");
    } catch {
      setError("تعذر إضافة العادة، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleToday(habit: Habit) {
    const optimistic = { ...habit, completedToday: !habit.completedToday };
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? optimistic : h)));
    try {
      const updated = await updateHabit(habit.id, { completedToday: !habit.completedToday });
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? updated : h)));
    } catch {
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
      setError("تعذر تحديث العادة");
    }
  }

  async function handleDelete(habitId: string) {
    const snapshot = habits;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await deleteHabit(habitId);
    } catch {
      setHabits(snapshot);
      setError("تعذر حذف العادة");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">العادات</h1>
        <p className="mt-1 text-sm text-ink/60">ابنِ عادات مذاكرة ثابتة وتابع تتابعك يومًا بعد يوم</p>
      </div>

      <Card>
        <form onSubmit={handleCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="عنوان العادة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حل ١٠ أسئلة رياضيات يوميًا"
              required
            />
          </div>
          <div className="sm:w-48">
            <Select
              label="التكرار"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
              options={FREQUENCY_OPTIONS}
            />
          </div>
          <Button type="submit" isLoading={isSubmitting}>
            <Plus className="h-4 w-4" />
            إضافة عادة
          </Button>
        </form>
      </Card>

      {error && <p className="rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading ? (
          <Card className="h-24 animate-pulse" />
        ) : habits.length === 0 ? (
          <Card className="text-center text-sm text-ink/50 sm:col-span-2">لا توجد عادات حتى الآن</Card>
        ) : (
          habits.map((habit) => (
            <Card key={habit.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{habit.title}</p>
                  <p className="mt-1 text-xs text-ink/50">{habit.frequency === "DAILY" ? "يوميًا" : "أسبوعيًا"}</p>
                </div>
                <button
                  onClick={() => handleDelete(habit.id)}
                  aria-label="حذف العادة"
                  className="text-ink/30 transition-colors hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Flame className="h-4 w-4" />
                  <span className="text-sm font-semibold">{habit.streak ?? 0} يوم متتالي</span>
                </div>
                <button
                  onClick={() => handleToggleToday(habit)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    habit.completedToday ? "bg-emerald-600 text-paper" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {habit.completedToday ? "منجزة اليوم ✓" : "تحديد كمنجزة"}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
