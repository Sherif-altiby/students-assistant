"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createTask, deleteTask, listTasks, updateTask } from "@/lib/tasks";
import type { Task, TaskFrequency } from "@/types";
import { cn } from "@/lib/utils";
import { FormInput } from "@/components/FormInput";
import { FormSelect } from "@/components/FormSelect.tsx";
import { PageHeader } from "@/components/ui/PageHeader";

const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "TODAY", label: "اليوم فقط" },
  { value: "EVERY_DAY", label: "كل الأيام" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("TODAY");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => setError("تعذر تحميل المهام"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const task = await createTask({ title: title.trim(), frequency });
      setTasks((prev) => [task, ...prev]);
      setTitle("");
      setFrequency("TODAY");
    } catch {
      setError("تعذر إضافة المهمة، حاول مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleComplete(task: Task) {
    const optimistic = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setError("تعذر تحديث حالة المهمة");
    }
  }

  async function handleFrequencyChange(
    task: Task,
    newFrequency: TaskFrequency,
  ) {
    const optimistic = { ...task, frequency: newFrequency };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimistic : t)));
    try {
      const updated = await updateTask(task.id, { frequency: newFrequency });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      setError("تعذر تحديث تكرار المهمة");
    }
  }

  async function handleDelete(taskId: string) {
    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await deleteTask(taskId);
    } catch {
      setTasks(snapshot);
      setError("تعذر حذف المهمة");
    }
  }

  return (
    <div className=" space-y-6   text-neutral-900 font-sans">
      <PageHeader
        title="المهام الدراسية"
        description="نظّم مهام مذاكرتك اليومية، تابع تقدّمك، وأنجز أهدافك خطوة بخطوة."
      />

      {/* Stats Board */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* بطاقة إجمالي المهام */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-neutral-500">
                إجمالي المهام
              </p>
              <h3 className="text-3xl font-black tracking-tight text-neutral-900 transition-colors group-hover:text-black">
                {tasks.length}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-50 text-neutral-600 transition-colors group-hover:bg-neutral-100">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          {/* خط تفاعلي سفلي نحيف جداً مستوحى من تويتر */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 transition-all duration-300 group-hover:bg-neutral-300" />
        </div>

        {/* بطاقة المهام المنجزة */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-100 hover:shadow-[0_8px_30px_rgb(29,155,240,0.03)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-neutral-500">
                تم إنجازها
              </p>
              <h3 className="text-3xl font-black tracking-tight text-sky-500">
                {tasks.filter((t) => t.completed).length}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-500 transition-colors group-hover:bg-sky-100/70">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 transition-all duration-300 group-hover:bg-sky-500" />
        </div>

        {/* بطاقة المهام المتبقية */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-5 text-right transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold tracking-wide text-neutral-500">
                المتبقي
              </p>
              <h3 className="text-3xl font-black tracking-tight text-neutral-400">
                {tasks.filter((t) => !t.completed).length}
              </h3>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-50 text-neutral-400 transition-colors group-hover:bg-neutral-100">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 transition-all duration-300 group-hover:bg-neutral-400" />
        </div>
      </div>

      {/* Form Card */}
      <Card className="border border-neutral-100 bg-white rounded-2xl p-5 shadow-sm">
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <FormInput
              label="عنوان المهمة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة الفصل الثالث في الفيزياء..."
              required
              className="w-full bg-neutral-50 border-neutral-200 rounded-xl focus:border-sky-500 focus:ring-sky-500/20 text-sm h-11"
            />
          </div>

          <div className="sm:w-48">
            <FormSelect
              label="التكرار"
              value={frequency}
              onValueChange={(value) => setFrequency(value as TaskFrequency)}
              options={FREQUENCY_OPTIONS}
              placeholder="اختر التكرار"
              className="w-full bg-neutral-50 border-neutral-200 rounded-xl focus:border-sky-500 text-sm h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white px-6 text-sm font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            {isSubmitting ? "جاري..." : "تغريد المهمة"}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-medium text-rose-600 text-right">
          {error}
        </div>
      )}

      {/* Tasks Feed */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <Card
                key={n}
                className="h-20 animate-pulse border border-neutral-100 rounded-2xl bg-neutral-50/50"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border border-neutral-100 bg-white rounded-2xl py-12 text-center">
            <p className="text-sm font-bold text-neutral-900">
              جدولك خالٍ تماماً
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              ابدأ بإضافة مهمتك الدراسية الأولى واصنع الفارق اليوم.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className={cn(
                  "group rounded-2xl border border-neutral-100 bg-white p-4 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50/30",
                  task.completed &&
                    "border-neutral-50 bg-neutral-50/20 opacity-75",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Checkbox button */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                        task.completed
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "border-neutral-300 hover:border-sky-500 hover:bg-sky-50/50",
                      )}
                    >
                      {task.completed && (
                        <Check className="h-3.5 w-3.5 stroke-[4]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1 text-right">
                      <h3
                        className={cn(
                          "text-sm font-bold text-neutral-900 leading-snug transition-all",
                          task.completed && "text-neutral-400 line-through",
                        )}
                      >
                        {task.title}
                      </h3>

                      <p className="mt-0.5 text-xs text-neutral-400">
                        {task.frequency === "TODAY"
                          ? "مهمة اليوم"
                          : "مهمة يومية مستمرة"}
                      </p>
                    </div>
                  </div>

                  {/* Left side actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleFrequencyChange(
                          task,
                          task.frequency === "TODAY" ? "EVERY_DAY" : "TODAY",
                        )
                      }
                      className={cn(
                        "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors md:flex border",
                        task.frequency === "TODAY"
                          ? "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                          : "border-sky-100 bg-sky-50/50 text-sky-600 hover:bg-sky-50",
                      )}
                    >
                      {task.frequency === "TODAY" ? (
                        <CalendarDays className="h-3.5 w-3.5" />
                      ) : (
                        <CalendarRange className="h-3.5 w-3.5" />
                      )}
                      {task.frequency === "TODAY" ? "اليوم فقط" : "كل الأيام"}
                    </button>

                    <button
                      onClick={() => handleDelete(task.id)}
                      className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
