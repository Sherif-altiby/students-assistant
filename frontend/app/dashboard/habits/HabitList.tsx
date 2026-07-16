"use client";

import { Inbox } from "lucide-react";
import { HabitListItem } from "./HabitListItem";
import type { Habit, HabitHistoryEntry } from "@/types";

interface HabitListProps {
  habits: Habit[];
  todayEntry: Pick<HabitHistoryEntry, "completedHabitIds">;
  isLoading: boolean;
  isCompleting: boolean;
  onComplete: (habitId: string) => void;
  onUpdateTitle: (payload: { id: string; title: string }) => void;
  onDelete: (habitId: string) => void;
}

export function HabitList({
  habits,
  todayEntry,
  isLoading,
  isCompleting,
  onComplete,
  onUpdateTitle,
  onDelete,
}: HabitListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-14 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">لا توجد عادات حتى الآن</p>
        <p className="text-xs text-muted-foreground/70">
          ابدأ بإضافة أول عادة لك من الأعلى
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {habits.map((habit) => (
        <HabitListItem
          key={habit.id}
          habit={habit}
          isDone={todayEntry.completedHabitIds.includes(habit.id)}
          isCompleting={isCompleting}
          onComplete={onComplete}
          onUpdateTitle={onUpdateTitle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}