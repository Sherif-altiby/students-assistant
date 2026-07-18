"use client";

import { useState, type FormEvent } from "react";
import { Plus, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PageHeader } from "@/components/ui/PageHeader";

import type { TaskFrequency } from "@/types/task";
import { useTasks } from "@/hooks/Usetasks";
import { StatsCards } from "./Statscards";
import { TaskItem } from "./Taskitem";
import { TaskHistory } from "./Taskhistory";
import { Label } from "@/components/ui/label";

const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "TODAY", label: "اليوم فقط" },
  { value: "EVERY_DAY", label: "كل الأيام" },
];

export default function TasksPage() {
  const {
    tasks,
    isLoading,
    error,
    createTask,
    isCreating,
    updateFrequency,
    updatingTaskId,
    deleteTask,
    deletingTaskId,
    completeTask,
    completingTaskId,
  } = useTasks();

  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("TODAY");

  function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask({ title: trimmed, frequency });
    setTitle("");
    setFrequency("TODAY");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="المهام الدراسية"
        description="نظّم مهام مذاكرتك اليومية، تابع تقدّمك، وأنجز أهدافك خطوة بخطوة."
      />

      <StatsCards tasks={tasks} />

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1.5">
          <Label
            htmlFor="task-title"
            className="text-sm font-medium text-foreground "
          >
            عنوان المهمة
          </Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: مراجعة الفصل الثالث في الفيزياء"
            required
            disabled={isCreating}
            className="h-11 w-full rounded-(--radius-md) border border-border bg-input/30 px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-1 focus:border-ring focus:ring-ring/30"
          />
        </div>

        <div className="space-y-1.5 sm:w-44">
          <Label
            htmlFor="task-frequency"
            className="text-sm font-medium text-foreground"
          >
            التكرار
          </Label>
          <CustomSelect
            id="task-frequency"
            value={frequency}
            onChange={(v) => setFrequency(v as TaskFrequency)}
            options={FREQUENCY_OPTIONS}
            disabled={isCreating}
          />
        </div>

        <Button
          type="submit"
          disabled={isCreating || !title.trim()}
          className="h-11 gap-2 rounded-[var(--radius-md)] bg-primary px-6 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {isCreating ? "جارٍ الإضافة..." : "إضافة مهمة"}
        </Button>
      </form>

      {error && (
        <p className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[68px] animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-14 text-center">
            <Inbox className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              جدولك خالٍ تمامًا
            </p>
            <p className="text-xs text-muted-foreground">
              ابدأ بإضافة مهمتك الدراسية الأولى من الأعلى
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isCompleting={completingTaskId === task.id}
              isUpdating={updatingTaskId === task.id}
              isDeleting={deletingTaskId === task.id}
              onComplete={completeTask}
              onFrequencyChange={updateFrequency}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>

      <TaskHistory />
    </div>
  );
}
