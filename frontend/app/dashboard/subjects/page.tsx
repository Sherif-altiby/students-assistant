"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreateStudySubjectDialog } from "./CreateStudySubjectDialog";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listStudySubjectsPage } from "@/lib/study-table";
import { useAuthStore } from "@/store/useAuthStore";

export default function StudySubjectsPage() {
  const user = useAuthStore((state) => state.user);
  const subjectsQuery = useQuery({
    queryKey: ["study-subjects", 1, 100],
    queryFn: () => listStudySubjectsPage({ page: 1, limit: 100 }),
  });

  return (
    <main dir="rtl" className="space-y-6 p-4">
      <PageHeader
        title="المواد الدراسية"
        description="تابع تقدمك الدراسي وحالة إنجاز الدروس في كل مادة"
      />
      {user?.role === "USER" && <CreateStudySubjectDialog />}

      {subjectsQuery.isLoading && (
        <div className="flex min-h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
          جارٍ تحميل المواد...
        </div>
      )}
      {subjectsQuery.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
          تعذر تحميل المواد الدراسية. يرجى المحاولة مرة أخرى.
        </p>
      )}
      {subjectsQuery.data && subjectsQuery.data.length === 0 && (
        <p className="rounded-lg border p-6 text-center text-muted-foreground">
          لا توجد مواد دراسية حالياً
        </p>
      )}

      {subjectsQuery.data && subjectsQuery.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjectsQuery.data.map((subject) => (
            <Card key={subject.id} className="gap-4">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{subject.title}</CardTitle>
                    <CardDescription>
                      {subject.unitsCount} وحدات · {subject.lessonsCount} درس
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 shrink-0 text-primary" />
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
                  تمت دراسة {subject.completedLessonsCount} من {subject.lessonsCount} درس
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
      )}
    </main>
  );
}
