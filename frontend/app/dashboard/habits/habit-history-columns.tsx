import { Badge } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { formatDateLabel } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Habit, HabitHistoryEntry } from "@/types";
import { CheckCircle2, Circle, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Builds the column definitions for the habit history table.
 * Takes `habits` since cells need to resolve completed IDs -> titles.
 */
export function getHabitHistoryColumns(
  habits: Habit[],
): DataTableColumn<HabitHistoryEntry>[] {
  return [
    {
      key: "date",
      header: "📅 التاريخ",
      cell: (entry) => (
        <span className="font-medium text-[#0f1419]">
          {formatDateLabel(entry.date)}
        </span>
      ),
      headerClassName: "w-40",
      cellClassName: "font-medium text-[#0f1419]",
    },
    {
      key: "completed",
      header: "✅ العادات المنجزة",
      cell: (entry) => <CompletedHabitsCell entry={entry} habits={habits} />,
      cellClassName: "py-2",
    },
    {
      key: "ratio",
      header: "📊 النسبة",
      cell: (entry) => <RatioCell entry={entry} habits={habits} />,
      headerClassName: "w-32 text-center",
      cellClassName: "text-center",
    },
  ];
}

function CompletedHabitsCell({
  entry,
  habits,
}: {
  entry: HabitHistoryEntry;
  habits: Habit[];
}) {
  const completedHabits = habits.filter((h) =>
    entry.completedHabitIds.includes(h.id),
  );
  const completionRate = (completedHabits.length / habits.length) * 100;

  if (completedHabits.length === 0) {
    return (
      <span className="flex items-center gap-2 text-sm text-[#71767b]">
        <Circle className="h-4 w-4" />
        لا توجد عادات منجزة
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {completedHabits.map((h) => (
        <Badge 
          key={h.id} 
          className="flex items-center gap-1.5 rounded-full bg-[#1d9bf0]/10 px-3 py-1 text-xs font-medium text-[#1d9bf0] hover:bg-[#1d9bf0]/20 border-0 transition-colors"
        >
          <CheckCircle2 className="h-3 w-3" />
          {h.title}
        </Badge>
      ))}
      {completedHabits.length < habits.length && (
        <span className="text-xs text-[#71767b]">
          +{habits.length - completedHabits.length} متبقية
        </span>
      )}
    </div>
  );
}

function RatioCell({
  entry,
  habits,
}: {
  entry: HabitHistoryEntry;
  habits: Habit[];
}) {
  const ratio = entry.completedHabitIds.length / habits.length;
  const percentage = Math.round(ratio * 100);
  
  // Determine color based on completion rate
  let colorClass = "text-[#71767b]";
  let icon = <Minus className="h-3.5 w-3.5" />;
  
  if (percentage === 100) {
    colorClass = "text-[#00ba7c]";
    icon = <TrendingUp className="h-3.5 w-3.5" />;
  } else if (percentage >= 50) {
    colorClass = "text-[#1d9bf0]";
    icon = <TrendingUp className="h-3.5 w-3.5" />;
  } else if (percentage > 0) {
    colorClass = "text-[#ff7a00]";
    icon = <TrendingDown className="h-3.5 w-3.5" />;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className={cn("text-sm font-semibold", colorClass)}>
          {percentage}%
        </span>
        <span className={colorClass}>{icon}</span>
      </div>
      <div className="hidden sm:block">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#eff3f4]">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${percentage}%`,
              background: percentage === 100 
                ? 'linear-gradient(90deg, #00ba7c, #00d4a0)' 
                : percentage >= 50
                ? 'linear-gradient(90deg, #1d9bf0, #1a8cd8)'
                : 'linear-gradient(90deg, #ff7a00, #ff9500)'
            }}
          />
        </div>
      </div>
    </div>
  );
}