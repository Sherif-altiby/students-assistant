"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getStudySubject } from "@/lib/study-table";

export default function StudySubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const subjectQuery = useQuery({
    queryKey: ["study-subject", id],
    queryFn: () => getStudySubject(id),
    enabled: Boolean(id),
  });
  const subject = subjectQuery.data;

  return (
    <main dir="rtl" className="space-y-6 p-4">
      <Link
        href="/dashboard/subjects"
        className={buttonVariants({ variant: "outline", className: "gap-2" })}
      >
        <ArrowRight className="h-4 w-4" />
        جميع المواد
      </Link>

      {subjectQuery.isLoading && (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
          جارٍ تحميل المادة...
        </div>
      )}
      {subjectQuery.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
          تعذر تحميل المادة الدراسية. يرجى المحاولة مرة أخرى.
        </p>
      )}

      {subject && (
        <>
          <PageHeader
            title={subject.title}
            description={`تمت دراسة ${subject.completedLessonsCount} من ${subject.lessonsCount} درس`}
          />
          <section className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm font-medium">
              <span>التقدم في المادة</span>
              <span>{subject.progressPercent}%</span>
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
          </section>

          <div className="space-y-4">
            {subject.units.map((unit) => {
              const completedCount = unit.lessons.filter((lesson) => lesson.isCompleted).length;
              return (
                <Card key={unit.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 font-bold">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {unit.title}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {completedCount} / {unit.lessons.length} دروس
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y">
                      {unit.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center gap-3 py-3">
                          {lesson.isCompleted
                            ? <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                            : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                          <span className="flex-1">{lesson.title}</span>
                          <span className={lesson.isCompleted
                            ? "text-sm font-medium text-green-700"
                            : "text-sm text-muted-foreground"}>
                            {lesson.isCompleted ? "تمت دراسته" : "لم تتم دراسته"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
