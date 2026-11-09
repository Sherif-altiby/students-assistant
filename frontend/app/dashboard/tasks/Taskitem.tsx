"use client";

import { CalendarDays, Check, Loader2, Repeat, Trash2 } from "lucide-react";
import { Task, TaskFrequency } from "@/types/task";

const FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  TODAY: "اليوم فقط",
  EVERY_DAY: "كل الأيام",
};

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
  const isRecurring = task.frequency === "EVERY_DAY";
  const nextFrequency: TaskFrequency = isRecurring ? "TODAY" : "EVERY_DAY";

  return (
    <div
      aria-busy={isDeleting}
      className={[
        "group flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-2xl border px-4 py-3.5 sm:flex-nowrap",
        "motion-safe:transition-[border-color,background-color,opacity] motion-safe:duration-200",
        task.completed
          ? "border-primary/20 bg-primary/[0.04]"
          : "border-border bg-card hover:border-primary/30",
        isDeleting ? "pointer-events-none opacity-40" : "",
      ].join(" ")}
    >
      {/* Complete toggle */}
      <button
        type="button"
        onClick={() => onComplete(task.id)}
        disabled={task.completed || isCompleting}
        aria-pressed={task.completed}
        aria-label={task.completed ? "منجزة اليوم" : "تحديد كمنجزة"}
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-safe:transition-all motion-safe:duration-200 enabled:active:scale-90 disabled:cursor-default",
          task.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary/60 hover:bg-primary/10 hover:text-primary/40",
        ].join(" ")}
      >
        {isCompleting ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Check
            className={[
              "h-4 w-4 motion-safe:transition-transform motion-safe:duration-200",
              task.completed ? "scale-100" : "scale-75",
            ].join(" ")}
            strokeWidth={3}
          />
        )}
      </button>

      {/* Title */}
      <p
        title={task.title}
        className={[
          "min-w-0 flex-1 basis-[calc(100%-3rem)] truncate text-[15px] font-medium sm:basis-0",
          "motion-safe:transition-colors",
          task.completed
            ? "text-muted-foreground line-through decoration-muted-foreground/50"
            : "text-foreground",
        ].join(" ")}
      >
        {task.title}
      </p>

      {/* Frequency: one tap toggles between "today only" and "every day" */}
      <button
        type="button"
        onClick={() => onFrequencyChange(task.id, nextFrequency)}
        disabled={isUpdating}
        aria-pressed={isRecurring}
        aria-label={`التكرار: ${FREQUENCY_LABEL[task.frequency]}. اضغط للتغيير إلى ${FREQUENCY_LABEL[nextFrequency]}`}
        className={[
          "ms-11 inline-flex h-8 min-w-[6.75rem] items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-medium outline-none sm:ms-0",
          "focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-wait disabled:opacity-60",
          "motion-safe:transition-colors motion-safe:duration-150",
          isRecurring
            ? "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
            : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
        ].join(" ")}
      >
        {isUpdating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isRecurring ? (
          <Repeat className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
        )}
        {FREQUENCY_LABEL[task.frequency]}
      </button>

      {/* Delete: always visible on touch, revealed on hover/focus on desktop */}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        disabled={isDeleting}
        aria-label="حذف المهمة"
        className={[
          "ms-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none sm:ms-0",
          "hover:bg-destructive/10 hover:text-destructive",
          "focus-visible:bg-destructive/10 focus-visible:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/30",
          "motion-safe:transition-[opacity,background-color,color] motion-safe:duration-150",
          "md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        ].join(" ")}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}