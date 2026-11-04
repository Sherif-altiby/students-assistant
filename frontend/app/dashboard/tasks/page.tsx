"use client";

import { useState, type FormEvent } from "react";
import { Plus, Inbox } from "lucide-react";
import MainButton from "@/components/ui/MainButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormInput } from "@/components/FormInput";
import { FormCustomSelect } from "@/components/FormCustomSelect";

import type { TaskFrequency } from "@/types/task";
import { useTasks } from "@/hooks/Usetasks";
import { StatsCards } from "./Statscards";
import { TaskItem } from "./Taskitem";
import { TaskHistory } from "./Taskhistory";

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
    <div className="space-y-6 p-4" >
      <PageHeader
        title="المهام الدراسية"
        description="نظّم مهام مذاكرتك اليومية، تابع تقدّمك، وأنجز أهدافك خطوة بخطوة."
      />

      <StatsCards tasks={tasks} />

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <FormInput
            label="عنوان المهمة"
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: مراجعة الفصل الثالث في الفيزياء"
            required
            disabled={isCreating}
          />
        </div>

        <FormCustomSelect
          className="sm:w-44"
          label="التكرار"
          id="task-frequency"
          value={frequency}
          onChange={setFrequency}
          options={FREQUENCY_OPTIONS}
          disabled={isCreating}
        />

        <MainButton
          type="submit"
          disabled={isCreating || !title.trim()}
          className="px-6"
          icon={<Plus className="h-4 w-4" />}
          title={isCreating ? "جارٍ الإضافة..." : "إضافة مهمة"}
        />
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
