"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-between gap-3 px-4 py-3">
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
          <p className="truncate text-sm font-semibold text-foreground">{habit.title}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          size="sm"
          variant={isDone ? "secondary" : "default"}
          disabled={isDone || isCompleting}
          onClick={() => onComplete(habit.id)}
        >
          {isDone ? "منجزة اليوم ✓" : "تحديد كمنجزة"}
        </Button>
        <Button size="icon" variant="ghost" onClick={startEdit} aria-label="تعديل العادة">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(habit.id)}
          aria-label="حذف العادة"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}