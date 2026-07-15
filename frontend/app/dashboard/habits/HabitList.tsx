"use client";

import { Card } from "@/components/ui/Card";
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
    return <Card className="h-24 animate-pulse bg-muted" />;
  }

  if (habits.length === 0) {
    return (
      <Card className="text-center text-sm text-muted-foreground">
        لا توجد عادات حتى الآن
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-border p-0">
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
    </Card>
  );
}