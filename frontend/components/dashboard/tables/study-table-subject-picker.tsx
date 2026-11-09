"use client";

import { ChevronLeft, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Section } from "@/components/dashboard/tables/study-table-form-sections";
import { cn } from "@/lib/utils";
import type {
  StudySubjectDetails,
  StudySubjectSummary,
} from "@/types/study-table";

function HierarchyCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <span className="relative inline-flex">
      <Checkbox
        checked={checked === true}
        aria-checked={checked === "indeterminate" ? "mixed" : checked}
        aria-label={ariaLabel}
        onCheckedChange={onCheckedChange}
      />
      {checked === "indeterminate" && (
        <Minus
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto size-3 text-primary"
        />
      )}
    </span>
  );
}

export function StudyTableSubjectPicker({
  subjects,
  loading,
  error,
  allowAllSubjects = true,
  allSubjects,
  selectedSubjects,
  selectedLessonIds,
  expandedSubjects,
  details,
  detailErrors,
  onAllSubjectsChange,
  onToggleSubject,
  onToggleExpansion,
  onRetrySubject,
  onToggleUnit,
  onToggleLesson,
}: {
  subjects: StudySubjectSummary[];
  loading: boolean;
  error: boolean;
  allowAllSubjects?: boolean;
  allSubjects: boolean;
  selectedSubjects: string[];
  selectedLessonIds: string[];
  expandedSubjects: string[];
  details: Map<string, StudySubjectDetails | undefined>;
  detailErrors: Set<string>;
  onAllSubjectsChange: (checked: boolean) => void;
  onToggleSubject: (subjectId: string) => void;
  onToggleExpansion: (subjectId: string) => void;
  onRetrySubject: (subjectId: string) => void;
  onToggleUnit: (
    subjectId: string,
    subjectLessonIds: string[],
    unitLessonIds: string[],
  ) => void;
  onToggleLesson: (
    subjectId: string,
    subjectLessonIds: string[],
    lessonId: string,
  ) => void;
}) {
  const showList = !allowAllSubjects || !allSubjects;
  const getCheckState = (ids: string[]): boolean | "indeterminate" => {
    const count = ids.filter((id) => selectedLessonIds.includes(id)).length;
    return count === 0 ? false : count === ids.length ? true : "indeterminate";
  };
  return (
    <Section
      title="المواد"
      hint={
        showList && selectedSubjects.length
          ? `${selectedSubjects.length} مادة مختارة`
          : undefined
      }
      action={
        allowAllSubjects ? (
          <label className="flex items-center gap-2 text-sm font-medium">
            <HierarchyCheckbox
              checked={allSubjects}
              onCheckedChange={onAllSubjectsChange}
            />
            جميع المواد
          </label>
        ) : undefined
      }
    >
      {!showList ? (
        <p className="text-sm text-muted-foreground">
          سيتم تضمين كل المواد في الجدول.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">جارٍ تحميل المواد...</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          تعذر تحميل قائمة المواد
        </p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {subjects.map((subject) => {
            const detail = details.get(subject.id);
            const isExpanded = expandedSubjects.includes(subject.id);
            const lessonIds =
              detail?.units.flatMap((unit) =>
                unit.lessons.map((lesson) => lesson.id),
              ) ?? [];
            return (
              <div key={subject.id} className="rounded-lg border bg-background">
                <div className="flex items-center gap-2 p-2.5">
                  <button
                    type="button"
                    aria-label={`فتح ${subject.title}`}
                    aria-expanded={isExpanded}
                    onClick={() => onToggleExpansion(subject.id)}
                    className="grid size-7 shrink-0 place-items-center rounded hover:bg-muted"
                  >
                    <ChevronLeft
                      className={cn(
                        "size-4 transition-transform",
                        isExpanded && "-rotate-90",
                      )}
                    />
                  </button>
                  <HierarchyCheckbox
                    checked={
                      detail
                        ? getCheckState(lessonIds)
                        : selectedSubjects.includes(subject.id)
                    }
                    ariaLabel={`تحديد جميع دروس ${subject.title}`}
                    onCheckedChange={() => onToggleSubject(subject.id)}
                  />
                  <span className="text-sm font-medium">{subject.title}</span>
                </div>
                {isExpanded && (
                  <div className="space-y-2 border-t px-4 py-3">
                    {detailErrors.has(subject.id) ? (
                      <p role="alert" className="text-xs text-destructive">
                        تعذر تحميل وحدات المادة ودروسها.{" "}
                        <button
                          type="button"
                          className="underline underline-offset-2"
                          onClick={() => onRetrySubject(subject.id)}
                        >
                          إعادة المحاولة
                        </button>
                      </p>
                    ) : !detail ? (
                      <p className="text-xs text-muted-foreground">
                        جارٍ تحميل الوحدات والدروس...
                      </p>
                    ) : detail.units.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        لا توجد دروس في هذه المادة.
                      </p>
                    ) : (
                      detail.units.map((unit) => {
                        const unitLessonIds = unit.lessons.map(
                          (lesson) => lesson.id,
                        );
                        return (
                          <div key={unit.id} className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <HierarchyCheckbox
                                checked={getCheckState(unitLessonIds)}
                                onCheckedChange={() =>
                                  onToggleUnit(
                                    subject.id,
                                    lessonIds,
                                    unitLessonIds,
                                  )
                                }
                              />
                              {unit.title}
                            </label>
                            <div className="ms-6 space-y-2 border-s-2 ps-3">
                              {unit.lessons.map((lesson) => (
                                <label
                                  key={lesson.id}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  <Checkbox
                                    checked={selectedLessonIds.includes(
                                      lesson.id,
                                    )}
                                    onCheckedChange={() =>
                                      onToggleLesson(
                                        subject.id,
                                        lessonIds,
                                        lesson.id,
                                      )
                                    }
                                  />
                                  {lesson.title}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
