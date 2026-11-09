"use client";

import { useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import MainButton from "@/components/ui/MainButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  StudyTableBasicsFields,
  StudyTablePeriodFields,
  StudyTableScheduleFields,
} from "@/components/dashboard/tables/study-table-form-sections";
import { StudyTableSubjectPicker } from "@/components/dashboard/tables/study-table-subject-picker";
import { StudyTablePreview } from "@/components/dashboard/tables/study-table-preview";
import {
  getStudySubject,
  listAvailableStudyMonths,
  listStudySubjects,
} from "@/lib/study-table";
import type {
  GenerateStudyTableInput,
  StudyTableGenerationResult,
  StudyTableInput,
  StudyTableType,
} from "@/types/study-table";

interface CreateStudyTableDialogProps {
  onCreate: (payload: StudyTableInput) => Promise<unknown>;
  onGenerate: (
    payload: GenerateStudyTableInput,
    preview: boolean,
  ) => Promise<StudyTableGenerationResult>;
  isCreating: boolean;
}

function localDateString(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function CreateStudyTableDialog({
  onCreate,
  onGenerate,
  isCreating,
}: CreateStudyTableDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<StudyTableType>("WEEKLY");
  const [mode, setMode] = useState<"generate" | "empty">("generate");
  const [startDate, setStartDate] = useState(() => localDateString(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 13);
    return localDateString(date);
  });
  const [selectedMonthKey, setSelectedMonthKey] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [allSubjects, setAllSubjects] = useState(true);
  const [studyWeekdays, setStudyWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [maxSessionsPerDay, setMaxSessionsPerDay] = useState(3);
  const [preview, setPreview] = useState<StudyTableGenerationResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const subjectsQuery = useQuery({
    queryKey: ["study-subject-catalog"],
    queryFn: listStudySubjects,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const availableMonthsQuery = useQuery({
    queryKey: ["study-table-available-months"],
    queryFn: () => listAvailableStudyMonths(),
    enabled: open && type === "MONTHLY",
  });
  const subjectDetailsQueries = useQueries({
    queries: expandedSubjects.map((id) => ({
      queryKey: ["study-subject", id],
      queryFn: () => getStudySubject(id),
      enabled: open,
      staleTime: 5 * 60 * 1000,
    })),
  });
  const subjectDetails = new Map(
    expandedSubjects.map((id, index) => [
      id,
      subjectDetailsQueries[index]?.data,
    ]),
  );
  const subjectDetailsWithErrors = new Set(
    expandedSubjects.filter(
      (_, index) => subjectDetailsQueries[index]?.isError,
    ),
  );
  const availableMonths = availableMonthsQuery.data?.months ?? [];
  const selectedMonth =
    availableMonths.find(
      (option) => `${option.year}-${option.month}` === selectedMonthKey,
    ) ?? availableMonths[0];

  function invalidatePreview() {
    setPreview(null);
  }

  function getTableInput(): StudyTableInput {
    const subjects =
      type === "GLOBAL" || !allSubjects ? selectedSubjects : "ALL";
    const lessonSelection =
      type === "GLOBAL" || !allSubjects ? { selectedLessonIds } : {};
    if (type === "MONTHLY") {
      if (!selectedMonth) throw new Error("لا توجد أشهر متاحة لإنشاء الجدول");
      return {
        title: title.trim(),
        type,
        subjects,
        month: selectedMonth.month,
        year: selectedMonth.year,
        ...lessonSelection,
      };
    }
    if (type === "WEEKLY") {
      return {
        title: title.trim(),
        type,
        subjects,
        startDate,
        ...lessonSelection,
      };
    }
    if (type === "GLOBAL") {
      return {
        title: title.trim(),
        type,
        subjects: selectedSubjects,
        startDate,
        endDate,
        selectedLessonIds,
      };
    }
    return {
      title: title.trim(),
      type,
      subjects,
      startDate,
      endDate,
      ...lessonSelection,
    };
  }

  function getGenerationInput(): GenerateStudyTableInput {
    const tableInput = getTableInput();
    return { ...tableInput, schedule: { studyWeekdays, maxSessionsPerDay } };
  }

  function validateForm() {
    if (!title.trim()) {
      toast.error("أدخل عنوان الجدول");
      return false;
    }
    if ((type === "GLOBAL" || !allSubjects) && selectedSubjects.length === 0) {
      toast.error("اختر مادة واحدة على الأقل");
      return false;
    }
    if ((type === "GLOBAL" || !allSubjects) && selectedLessonIds.length === 0) {
      toast.error("اختر درساً واحداً على الأقل");
      return false;
    }
    if (type === "MONTHLY" && !selectedMonth) {
      toast.error(
        availableMonthsQuery.isError
          ? "تعذر تحميل الأشهر المتاحة"
          : "لا توجد أشهر متاحة لإنشاء الجدول",
      );
      return false;
    }
    if (
      type !== "MONTHLY" &&
      (!startDate || (type !== "WEEKLY" && (!endDate || endDate < startDate)))
    ) {
      toast.error("تحقق من تاريخ بداية ونهاية الجدول");
      return false;
    }
    if (studyWeekdays.length === 0 && mode === "generate") {
      toast.error("اختر يوماً واحداً على الأقل للمذاكرة");
      return false;
    }
    return true;
  }

  async function handlePreview() {
    if (!validateForm()) return;
    setBusy(true);
    try {
      setPreview(await onGenerate(getGenerationInput(), true));
    } catch {
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    if (mode === "generate" && !preview) {
      await handlePreview();
      return;
    }
    setBusy(true);
    try {
      if (mode === "empty") await onCreate(getTableInput());
      else await onGenerate(getGenerationInput(), false);
      setOpen(false);
      setTitle("");
      setPreview(null);
    } catch {
      // Mutation error handlers display the request failure.
    } finally {
      setBusy(false);
    }
  }

  function toggleLessons(
    subjectId: string,
    subjectLessonIds: string[],
    targetIds: string[],
  ) {
    const shouldSelect = targetIds.some(
      (id) => !selectedLessonIds.includes(id),
    );
    const next = new Set(selectedLessonIds);
    for (const id of targetIds) {
      if (shouldSelect) next.add(id);
      else next.delete(id);
    }
    setSelectedLessonIds([...next]);
    setSelectedSubjects((current) =>
      subjectLessonIds.some((id) => next.has(id))
        ? current.includes(subjectId)
          ? current
          : [...current, subjectId]
        : current.filter((id) => id !== subjectId),
    );
    invalidatePreview();
  }

  async function toggleSubjectExpansion(id: string) {
    if (expandedSubjects.includes(id)) {
      setExpandedSubjects((current) => current.filter((value) => value !== id));
      return;
    }
    setExpandedSubjects((current) => [...current, id]);
    try {
      await queryClient.fetchQuery({
        queryKey: ["study-subject", id],
        queryFn: () => getStudySubject(id),
        staleTime: 5 * 60 * 1000,
      });
    } catch {
      toast.error("تعذر تحميل وحدات المادة ودروسها");
    }
  }

  async function toggleWholeSubject(subjectId: string) {
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ["study-subject", subjectId],
        queryFn: () => getStudySubject(subjectId),
        staleTime: 5 * 60 * 1000,
      });
      const ids = detail.units.flatMap((unit) =>
        unit.lessons.map((lesson) => lesson.id),
      );
      toggleLessons(subjectId, ids, ids);
      setExpandedSubjects((current) =>
        current.includes(subjectId) ? current : [...current, subjectId],
      );
    } catch {
      toast.error("تعذر تحميل دروس المادة");
    }
  }

  function toggleWeekday(index: number) {
    setStudyWeekdays((current) =>
      current.includes(index)
        ? current.filter((value) => value !== index)
        : [...current, index].sort(),
    );
    invalidatePreview();
  }

  function changeSessions(value: number) {
    setMaxSessionsPerDay(Math.min(50, Math.max(1, value || 1)));
    invalidatePreview();
  }

  const loading = busy || isCreating;
  const submitDisabled =
    subjectsQuery.isError ||
    (type === "MONTHLY" &&
      (availableMonthsQuery.isLoading || availableMonthsQuery.isError)) ||
    (mode === "generate" && studyWeekdays.length === 0);
  const eligibleDays =
    preview && maxSessionsPerDay > 0 ? preview.capacity / maxSessionsPerDay : 0;
  const averagePerDay =
    preview && eligibleDays > 0
      ? (preview.scheduledCount / eligibleDays).toFixed(1)
      : "0.0";

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setPreview(null);
      }}
    >
      <DialogTrigger
        render={<MainButton icon={<Plus />} title="جدول مذاكرة جديد" />}
      />
      <DialogContent
        dir="rtl"
        closeButtonClassName="right-auto left-2"
        className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-3xl"
      >
        <DialogHeader className="pb-4 text-start">
          <DialogTitle className="text-xl font-bold">
            إنشاء جدول مذاكرة
          </DialogTitle>
          <DialogDescription>
            حدّد الفترة والمواد وأيام المذاكرة، وراجع الخطة قبل حفظها.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <StudyTableBasicsFields
            title={title}
            type={type}
            mode={mode}
            onTitleChange={(value) => {
              setTitle(value);
              invalidatePreview();
            }}
            onTypeChange={(value) => {
              setType(value);
              invalidatePreview();
            }}
            onModeChange={(value) => {
              setMode(value);
              invalidatePreview();
            }}
          />
          <StudyTablePeriodFields
            type={type}
            startDate={startDate}
            endDate={endDate}
            months={availableMonths}
            selectedMonth={selectedMonth}
            selectedMonthKey={selectedMonthKey}
            monthsLoading={availableMonthsQuery.isLoading}
            monthsError={availableMonthsQuery.isError}
            today={availableMonthsQuery.data?.today}
            onMonthChange={(value) => {
              setSelectedMonthKey(value);
              invalidatePreview();
            }}
            onStartDateChange={(value) => {
              setStartDate(value);
              if (endDate < value) setEndDate(value);
              invalidatePreview();
            }}
            onEndDateChange={(value) => {
              setEndDate(value);
              invalidatePreview();
            }}
          />
          <StudyTableSubjectPicker
            subjects={subjectsQuery.data ?? []}
            loading={subjectsQuery.isLoading}
            error={subjectsQuery.isError}
            allowAllSubjects={type !== "GLOBAL"}
            allSubjects={allSubjects}
            selectedSubjects={selectedSubjects}
            selectedLessonIds={selectedLessonIds}
            expandedSubjects={expandedSubjects}
            details={subjectDetails}
            detailErrors={subjectDetailsWithErrors}
            onAllSubjectsChange={(checked) => {
              setAllSubjects(checked);
              if (checked) {
                setSelectedSubjects([]);
                setSelectedLessonIds([]);
              }
              invalidatePreview();
            }}
            onToggleSubject={(id) => void toggleWholeSubject(id)}
            onToggleExpansion={(id) => void toggleSubjectExpansion(id)}
            onRetrySubject={(id) =>
              void queryClient.refetchQueries({
                queryKey: ["study-subject", id],
                exact: true,
              })
            }
            onToggleUnit={(subjectId, subjectLessonIds, unitLessonIds) =>
              toggleLessons(subjectId, subjectLessonIds, unitLessonIds)
            }
            onToggleLesson={(subjectId, subjectLessonIds, lessonId) =>
              toggleLessons(subjectId, subjectLessonIds, [lessonId])
            }
          />
          {mode === "generate" && (
            <StudyTableScheduleFields
              weekdays={studyWeekdays}
              maxSessionsPerDay={maxSessionsPerDay}
              onToggleWeekday={toggleWeekday}
              onMaxSessionsChange={changeSessions}
            />
          )}
          {preview && (
            <StudyTablePreview
              preview={preview}
              studyWeekdays={studyWeekdays}
              eligibleDays={eligibleDays}
              averagePerDay={averagePerDay}
            />
          )}
          <div className="sticky bottom-0 -mx-1 border-t bg-background/95 px-1 pb-1 pt-3 backdrop-blur">
            <MainButton
              type="submit"
              fullWidth
              loading={loading}
              loadingTitle={
                mode === "generate" && !preview
                  ? "جارٍ إعداد المعاينة…"
                  : "جارٍ الحفظ…"
              }
              disabled={submitDisabled}
              title={
                mode === "generate" && !preview ? "معاينة الخطة" : "حفظ الجدول"
              }
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
