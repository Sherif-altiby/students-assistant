// app/doctor/page.tsx
"use client";

import Link from "next/link";
import { MessageCircle, ArrowLeft, CalendarCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import MainButton from "@/components/ui/MainButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingsMarquee } from "@/components/doctor/RatingMarquee";
import { DoctorStats } from "@/components/doctor/DoctorStats";
import { UpcomingSessions } from "@/components/doctor/UpcomingSessions";
import { useDoctorRatings } from "@/hooks/useSupport";
import { useMyStudents } from "@/hooks/useMyStudents";
import { DOCTOR_DASHBOARD_FALLBACK_NAME } from "@/constants";

export default function DoctorDashboardPage() {
  const name = useAuthStore(
    (state) => state.user?.name ?? DOCTOR_DASHBOARD_FALLBACK_NAME,
  );
  const {
    ratings,
    isLoading: ratingsLoading,
    error: ratingsError,
  } = useDoctorRatings();
  const { data: students = [], isLoading: studentsLoading } = useMyStudents();

  const recentStudents = students.slice(0, 4);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-12">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CalendarCheck className="h-3.5 w-3.5" />
              لوحة الطبيب
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              أهلاً، {name}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              نظرة سريعة على نشاطك، جلساتك القادمة، وطلابك — كل شيء في مكان واحد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              render={<Link href="/doctor/chat" />}
              nativeButton={false}
              variant="outline"
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              المحادثات
            </Button>
            <MainButton
              render={<Link href="/doctor/bookings" />}
              title="إدارة كل الحجوزات"
            />
          </div>
        </header>

        {/* ── Stats ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading title="إحصائياتك" hint="ملخص سريع لأدائك" />
          <DoctorStats />
        </section>

        {/* ── Upcoming sessions ──────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            title="أقرب الجلسات القادمة"
            hint="الجلسات المؤكدة التي تنتظرك"
            action={
              <Link
                href="/doctor/bookings"
                className="text-sm font-medium text-primary hover:underline"
              >
                عرض الكل
              </Link>
            }
          />
          <UpcomingSessions />
        </section>

        {/* ── Students (chat entry point) ────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            title="طلابي"
            hint="افتح محادثة مباشرة مع طالب"
            action={
              <Link
                href="/doctor/chat"
                className="text-sm font-medium text-primary hover:underline"
              >
                كل المحادثات
              </Link>
            }
          />

          {studentsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/60 shadow-sm">
                  <CardContent className="h-24 animate-pulse" />
                </Card>
              ))}
            </div>
          ) : recentStudents.length === 0 ? (
            <Card className="border-dashed border-border shadow-none">
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <MessageCircle className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  لا يوجد طلاب بعد — اقبل حجزاً لبدء محادثة.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentStudents.map((s) => (
                <Card
                  key={s.studentId}
                  className="group border-border/60 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {s.studentName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {s.studentName}
                        </p>
                        <Badge
                          variant={s.canSend ? "default" : "secondary"}
                          className="mt-1 text-[10px]"
                        >
                          {s.canSend ? "نشط" : "سجل"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      render={
                        <Link href={`/dashboard/chat?chat=${s.chatId}`} />
                      }
                      size="icon"
                      variant="ghost"
                      aria-label={`فتح المحادثة مع ${s.studentName}`}
                      className="shrink-0 group-hover:bg-primary/10 group-hover:text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ── Ratings ────────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading title="آراء المستفيدين" hint="ما يقوله طلابك عنك" />

          {ratingsLoading ? (
            <p className="text-sm text-muted-foreground" role="status">
              جارٍ تحميل الآراء...
            </p>
          ) : ratingsError ? (
            <p className="text-sm text-destructive" role="alert">
              {ratingsError}
            </p>
          ) : ratings.length > 0 ? (
            <RatingsMarquee ratings={ratings} />
          ) : (
            <p className="text-sm text-muted-foreground">
              لا توجد آراء للمستفيدين حتى الآن.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="space-y-0.5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  );
}