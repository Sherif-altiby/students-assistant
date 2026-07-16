"use client";

import { useState } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Habit } from "@/types";

interface HabitListItemProps {
  habit: Habit;
  isDone: boolean;
  isCompleting: boolean;
  onComplete: (habitId: string) => void;
  onUpdateTitle: (payload: { id: string; title: string }) => void;
  onDelete: (habitId: string) => void;
}

export function HabitListItem({
  habit,
  isDone,
  isCompleting,
  onComplete,
  onUpdateTitle,
  onDelete,
}: HabitListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(habit.title);

  function startEdit() {
    setEditValue(habit.title);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === habit.title) return;
    onUpdateTitle({ id: habit.id, title: trimmed });
  }

  return (
    <div className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/40">
      <button
        type="button"
        onClick={() => onComplete(habit.id)}
        disabled={isDone || isCompleting}
        aria-pressed={isDone}
        aria-label={isDone ? "منجزة اليوم" : "تحديد كمنجزة"}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-default ${
          isDone
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary/50"
        }`}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <Input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onBlur={commitEdit}
            className="h-8"
          />
        ) : (
          <p
            className={`truncate text-sm font-medium transition-colors ${
              isDone ? "text-muted-foreground" : "text-foreground"
            }`}
          >
            {habit.title}
          </p>
        )}
      </div>

      {!isEditing && (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={startEdit}
            aria-label="تعديل العادة"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(habit.id)}
            aria-label="حذف العادة"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}