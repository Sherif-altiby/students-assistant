"use client";

import { Check, Loader2, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Task, TaskFrequency } from "@/types/task";

const FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  TODAY: "اليوم فقط",
  EVERY_DAY: "كل الأيام",
};

const FREQUENCY_OPTIONS: { value: TaskFrequency; label: string }[] = [
  { value: "TODAY", label: "اليوم فقط" },
  { value: "EVERY_DAY", label: "كل الأيام" },
];

interface TaskItemProps {
  task: Task;
  isCompleting: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onComplete: (id: string) => void;
  onFrequencyChange: (id: string, frequency: TaskFrequency) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({
  task,
  isCompleting,
  isUpdating,
  isDeleting,
  onComplete,
  onFrequencyChange,
  onDelete,
}: TaskItemProps) {
  return (
    <div
      className={`group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/25 ${
        isDeleting ? "pointer-events-none opacity-40" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        disabled={task.completed || isCompleting}
        aria-pressed={task.completed}
        aria-label={task.completed ? "منجزة اليوم" : "تحديد كمنجزة"}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-default ${
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary/50"
        }`}
      >
        {isCompleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Check className="h-4 w-4" strokeWidth={3} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium transition-colors ${
            task.completed ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {task.title}
        </p>
      </div>

      <div className="w-[120px] shrink-0">
        <CustomSelect
          value={task.frequency}
          onChange={(v) => onFrequencyChange(task.id, v as TaskFrequency)}
          options={FREQUENCY_OPTIONS}
          disabled={isUpdating}
          // className="flex h-8 w-[120px] items-center justify-between rounded-full border border-border bg-transparent px-3 text-xs text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
        />
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="حذف المهمة"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}