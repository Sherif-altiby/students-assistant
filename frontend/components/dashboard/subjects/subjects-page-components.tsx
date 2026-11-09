import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { StudyItemActions } from "@/app/dashboard/subjects/StudyItemActions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudySubjectSummary } from "@/types/study-table";

export function SubjectsLoadingSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="جارٍ تحميل المواد الدراسية"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Card key={index} className="gap-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SubjectsLoadError() {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/40 p-4 text-sm text-destructive"
    >
      تعذر تحميل المواد الدراسية. يرجى المحاولة مرة أخرى.
    </p>
  );
}

export function SubjectsEmptyState({
  canCreate,
  createAction,
}: {
  canCreate: boolean;
  createAction?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex min-h-64 flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] px-6 py-10 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
        <BookOpen className="h-7 w-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-foreground">
          لا توجد مواد دراسية بعد
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {canCreate
            ? "أضف أول مادة لتبدأ بتتبع وحداتك ودروسك وتقدمك."
            : "ستظهر المواد الدراسية هنا فور إضافتها."}
        </p>
      </div>

      {canCreate && createAction}
    </div>
  );
}

export function SubjectsGrid({
  subjects,
}: {
  subjects: StudySubjectSummary[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {subjects.map((subject) => (
        <Card key={subject.id} className="gap-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg font-bold">
                  {subject.title}
                </CardTitle>
                <CardDescription>
                  {subject.unitsCount} وحدات · {subject.lessonsCount} درس
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {subject.isEditable && (
                  <StudyItemActions
                    type="subject"
                    id={subject.id}
                    title={subject.title}
                    subjectId={subject.id}
                  />
                )}
                <BookOpen className="h-5 w-5 shrink-0 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>التقدم</span>
              <span className="font-semibold">{subject.progressPercent}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`التقدم في مادة ${subject.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={subject.progressPercent}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${subject.progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              تمت دراسة {subject.completedLessonsCount} من{" "}
              {subject.lessonsCount} درس
            </p>
            <Link
              href={`/dashboard/subjects/${subject.id}`}
              className={buttonVariants()}
            >
              عرض الوحدات والدروس
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
