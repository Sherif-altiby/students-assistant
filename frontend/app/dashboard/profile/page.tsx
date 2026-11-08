"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Table2,
  UserRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listStudySubjectsPage, listStudyTables } from "@/lib/study-table";
import { useAuthStore } from "@/store/useAuthStore";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function StudentProfilePage() {
  const user = useAuthStore((state) => state.user);
  const subjectsQuery = useQuery({
    queryKey: ["study-subjects", 1, 100],
    queryFn: () => listStudySubjectsPage({ page: 1, limit: 100 }),
  });
  const tablesQuery = useQuery({
    queryKey: ["study-tables", "student-profile", 1, 100],
    queryFn: () => listStudyTables({ page: 1, limit: 100 }),
  });

  const subjects = subjectsQuery.data ?? [];
  const tables = tablesQuery.data?.data ?? [];
  const lessonCount = subjects.reduce((total, subject) => total + subject.lessonsCount, 0);
  const completedLessons = subjects.reduce(
    (total, subject) => total + subject.completedLessonsCount,
    0,
  );
  const overallProgress = lessonCount
    ? Math.round((completedLessons / lessonCount) * 100)
    : 0;

  return (
    <main dir="rtl" className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="لوحة متابعة الطالب"
        description="تابع جداول مذاكرتك وموادك الدراسية وإنجازك في مكان واحد"
      />

      <Card className="overflow-hidden border-primary/15 bg-gradient-to-l from-primary/10 via-card to-card">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <UserRound className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">مرحبًا بعودتك</p>
              <h2 className="mt-1 truncate text-2xl font-black text-foreground">
                {user?.name ?? "الطالب"}
              </h2>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {user?.email && (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="inline-flex items-center gap-1.5" dir="ltr">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section aria-label="ملخص الإنجاز" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-primary/10 p-3 text-primary"><BookOpen className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">المواد الدراسية</p>
              <p className="mt-1 text-2xl font-black">{subjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">الدروس المكتملة</p>
              <p className="mt-1 text-2xl font-black">{completedLessons} <span className="text-sm font-medium text-muted-foreground">من {lessonCount}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-600"><Table2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">جداول المذاكرة</p>
              <p className="mt-1 text-2xl font-black">{tablesQuery.data?.pagination.totalItems ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-xl">إنجازك الدراسي</CardTitle>
              <CardDescription className="mt-1">نسبة الدروس التي أتممتها في موادك</CardDescription>
            </div>
            <span className="text-2xl font-black text-primary">{overallProgress}%</span>
          </div>
        </CardHeader>
        <CardContent>
          {subjectsQuery.isLoading ? (
            <div className="h-3 animate-pulse rounded-full bg-muted" />
          ) : subjectsQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">تعذر تحميل بيانات الإنجاز الدراسي.</p>
          ) : (
            <ProgressBar value={overallProgress} label="نسبة الإنجاز الدراسي الإجمالية" />
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">جداول المذاكرة</h2>
            <p className="mt-1 text-sm text-muted-foreground">خططك الدراسية والفترة والمواد المرتبطة بكل جدول</p>
          </div>
          <Link href="/dashboard/tables" className={buttonVariants({ variant: "outline", size: "sm" })}>
            كل الجداول <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {tablesQuery.isLoading ? (
          <div className="flex min-h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ تحميل الجداول...
          </div>
        ) : tablesQuery.isError ? (
          <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            تعذر تحميل جداول المذاكرة. يرجى المحاولة مرة أخرى.
          </p>
        ) : tables.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <Table2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">لا توجد جداول مذاكرة بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">أنشئ جدولك الأول لتنظيم خطتك الدراسية.</p>
            <Link href="/dashboard/tables" className={`${buttonVariants({ size: "sm" })} mt-4`}>
              الانتقال إلى الجداول <ArrowLeft className="h-4 w-4" />
            </Link>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tables.map((table) => (
              <Link key={table.id} href={`/dashboard/tables/${table.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold group-hover:text-primary">{table.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(table.startDate)} — {formatDate(table.endDate)}
                        </p>
                      </div>
                      <ArrowLeft className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {table.allSubjects
                        ? "جميع المواد"
                        : table.subjects.map(({ subject }) => subject.title).join("، ") || "لا توجد مواد محددة"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">تقدمك في المواد</h2>
            <p className="mt-1 text-sm text-muted-foreground">تابع الدروس المكتملة والمتبقية لكل مادة</p>
          </div>
          <Link href="/dashboard/subjects" className={buttonVariants({ variant: "outline", size: "sm" })}>
            كل المواد <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {subjectsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : subjectsQuery.isError ? (
          <p role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
            تعذر تحميل المواد الدراسية. يرجى المحاولة مرة أخرى.
          </p>
        ) : subjects.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
            لا توجد مواد دراسية متاحة لمسارك حاليًا.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/dashboard/subjects/${subject.id}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold group-hover:text-primary">{subject.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {subject.unitsCount} وحدات · {subject.lessonsCount} درس
                        </p>
                      </div>
                      <span className="text-lg font-black text-primary">{subject.progressPercent}%</span>
                    </div>
                    <ProgressBar value={subject.progressPercent} label={`التقدم في مادة ${subject.title}`} />
                    <p className="text-xs text-muted-foreground">
                      أتممت {subject.completedLessonsCount} من {subject.lessonsCount} درس
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
