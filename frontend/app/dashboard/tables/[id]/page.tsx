"use client";

import { use, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DaySubjectsEditorDialog } from "../DaySubjectsEditorDialog";
import { StudyTableTypeBadge } from "../StudyTableTypeBadge";
import { useStudyTable } from "@/hooks/useStudyTable";
import { useStudyTables } from "@/hooks/useStudyTables";
import type { StudyTableDayDetailed } from "@/types/study-table";
import { DayCell } from "../DayCell";

interface StudyTableDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function StudyTableDetailPage() {

  const params = useParams();  
  const id = params.id as string;
  const router = useRouter();

  const {
    table,
    isLoading,
    updateTitle,
    isUpdatingTitle,
    toggleLessonComplete,
    isCompletingLesson,
    saveDaySubjects,
    isSavingDaySubjects,
  } = useStudyTable(id);

  const { deleteTable } = useStudyTables();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDay, setEditingDay] = useState<StudyTableDayDetailed | null>(
    null,
  );

  function startEditTitle() {
    if (!table) return;
    setTitleValue(table.title);
    setIsEditingTitle(true);
  }

  function commitTitle() {
    const trimmed = titleValue.trim();
    setIsEditingTitle(false);
    if (!trimmed || trimmed === table?.title) return;
    updateTitle(trimmed);
  }

  function handleDelete() {
    deleteTable(id);
    router.push("/dashboard/tables");
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="h-20 animate-pulse bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <Card className="text-center text-sm text-muted-foreground">
        تعذر العثور على هذا الجدول
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-7">

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
              <CalendarDays className="h-7 w-7 text-primary" />
            </div>
            <div>
              {isEditingTitle ? (
                <Input
                  autoFocus
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  onBlur={commitTitle}
                  className="h-9 text-2xl font-extrabold"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {table.title}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={startEditTitle}
                    aria-label="تعديل العنوان"
                  >
                    {isUpdatingTitle ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
              <div className="mt-1.5 flex items-center gap-2">
                <StudyTableTypeBadge type={table.type} />
                <span className="text-sm text-muted-foreground">
                  {table.days.length} يوم
                </span>
              </div>
            </div>
          </div>

          <ConfirmDialog
            trigger={
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                حذف الجدول
              </Button>
            }
            title="حذف الجدول؟"
            description={`سيتم حذف "${table.title}" وكل بياناته نهائيًا. لا يمكن التراجع عن هذا الإجراء.`}
            confirmLabel="حذف"
            onConfirm={handleDelete}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {table.days.map((day) => (
          <DayCell
            key={day.id}
            day={day}
            onEdit={setEditingDay}
            onToggleLesson={toggleLessonComplete}
            isTogglingLesson={isCompletingLesson}
          />
        ))}
      </div>

      <DaySubjectsEditorDialog
        day={editingDay}
        onClose={() => setEditingDay(null)}
        onSave={(dayId, payload, hasExisting) => {
          saveDaySubjects(dayId, payload, hasExisting);
          setEditingDay(null);
        }}
        isSaving={isSavingDaySubjects}
      />
    </div>
  );
}
