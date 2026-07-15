"use client";

import { Repeat } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import { getHabitHistoryColumns } from "./habit-history-columns";

import { useHabits } from "@/hooks/useHabits";
import { HabitList } from "./HabitList";
import { CreateHabitForm } from "./CreateHabitForm";

export default function HabitsPage() {
  const {
    habits,
    todayEntry,
    isLoading,
    error,
    createHabit,
    isCreating,
    completeHabit,
    isCompleting,
    updateHabitTitle,
    deleteHabit,
    history,
    historyPagination,
    setHistoryPage,
    isHistoryFetching,
  } = useHabits();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العادات"
        description="ابنِ عادات مذاكرة ثابتة وتابع تتابعك يومًا بعد يوم"
        icon={<Repeat className="h-7 w-7 text-primary" />}
      />

      <CreateHabitForm onCreate={createHabit} isCreating={isCreating} />

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <HabitList
        habits={habits}
        todayEntry={todayEntry}
        isLoading={isLoading}
        isCompleting={isCompleting}
        onComplete={completeHabit}
        onUpdateTitle={updateHabitTitle}
        onDelete={deleteHabit}
      />

      {historyPagination && (
        <DataTable
          title="سجل الإنجاز"
          data={history}
          getRowId={(entry) => entry.date}
          columns={getHabitHistoryColumns(habits)}
          manualPagination
          page={historyPagination.currentPage}
          pageCount={historyPagination.totalPages}
          onPageChange={setHistoryPage}
          isFetching={isHistoryFetching}
        />
      )}
    </div>
  );
}