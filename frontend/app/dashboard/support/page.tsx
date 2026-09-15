"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctors, useUserBookings } from "@/hooks/useSupport";
import type { BookingWithSlot, DoctorSummary } from "@/types/support";

const bookingStatus = {
  PENDING: { label: "قيد الموافقة", tone: "bg-amber-100 text-amber-700" },
  ACCEPTED: { label: "مؤكد", tone: "bg-emerald-100 text-emerald-700" },
  REJECTED: { label: "مرفوض", tone: "bg-rose-100 text-rose-700" },
  CANCELLED: { label: "ملغى", tone: "bg-slate-200 text-slate-700" },
  COMPLETED: { label: "مكتمل", tone: "bg-sky-100 text-sky-700" },
} as const;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDoctorInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAvgRating(doctor: DoctorSummary) {
  return doctor.averageRating ?? 0;
}

export default function SupportPage() {
  const {
    doctors,
    isLoading: doctorsLoading,
    isError: doctorsError,
  } = useDoctors({ page: 1, limit: 6 });

  const {
    bookings,
    isLoading: bookingsLoading,
    error: bookingsError,
    cancelBooking,
    isCancelling,
  } = useUserBookings();

  const upcomingBookings = bookings.filter((booking) => {
    const startsAt = new Date(booking.slot.startTime);
    const isUpcoming = startsAt >= new Date();
    return isUpcoming && ["PENDING", "ACCEPTED"].includes(booking.status);
  });

  const previousBookings = bookings.filter((booking) => {
    const startsAt = new Date(booking.slot.startTime);
    return startsAt < new Date() || booking.status === "COMPLETED";
  });

  const avgDoctorRating =
    doctors.length > 0
      ? (
          doctors.reduce((total, doctor) => total + getAvgRating(doctor), 0) /
          doctors.length
        ).toFixed(1)
      : "0.0";

  const completedCount = bookings.filter((booking) => booking.status === "COMPLETED").length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الدعم النفسي</h1>
            <p className="text-sm text-muted-foreground">
              احجز جلسة مع متخصص وراجع كل جلساتك السابقة والقادمة
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">الجلسات القادمة</p>
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-bold">{upcomingBookings.length}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">الجلسات المكتملة</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-3xl font-bold">{completedCount}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">متوسط تقييم الأطباء</p>
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          </div>
          <p className="mt-3 text-3xl font-bold">{avgDoctorRating}</p>
        </Card>
      </div>

      <Card className="p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">الأطباء المتاحون</h2>
            <p className="text-sm text-muted-foreground">قارن التقييمات واختر الطبيب المناسب لك</p>
          </div>
          <Link href="/dashboard/doctors">
            <Button variant="outline" size="sm">
              عرض الجميع
            </Button>
          </Link>
        </div>

        {doctorsError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            تعذر تحميل قائمة الأطباء
          </p>
        )}

        {doctorsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => {
              const rating = getAvgRating(doctor);
              const reviewCount = doctor.totalRatings ?? 0;

              return (
                <Card key={doctor.id} className="flex h-full flex-col p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {getDoctorInitials(doctor.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doctor.country || "غير محدد"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium text-foreground">
                        {rating > 0 ? rating.toFixed(1) : "—"}
                      </span>
                    </div>
                    <Badge variant={doctor.status === "ACTIVE" ? "default" : "secondary"}>
                      {doctor.status === "ACTIVE" ? "متاح" : "غير متاح"}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {reviewCount > 0
                      ? `${reviewCount} تقييم${reviewCount === 1 ? "" : "ات"}`
                      : "لا توجد تقييمات بعد"}
                  </p>

                  <div className="mt-auto pt-4">
                    <Link href={`/dashboard/doctors/${doctor.id}`}>
                      <Button className="w-full">عرض المواعيد</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Card className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">الجلسات القادمة</h2>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد جلسات قادمة في الوقت الحالي
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">د. {booking.slot.doctorId}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(booking.slot.startTime)}
                      </p>
                    </div>
                    <Badge className={bookingStatus[booking.status]?.tone ?? "bg-slate-200 text-slate-700"}>
                      {bookingStatus[booking.status]?.label ?? booking.status}
                    </Badge>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {booking.note ? `ملاحظة: ${booking.note}` : "لا توجد ملاحظات إضافية"}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isCancelling}
                      onClick={() => cancelBooking(booking.id)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bookingsError && (
            <p className="mt-3 text-sm text-rose-600">{bookingsError}</p>
          )}
        </Card>

        <Card className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">الجلسات السابقة</h2>
            <Clock3 className="h-5 w-5 text-slate-500" />
          </div>

          {bookingsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : previousBookings.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              لا توجد جلسات سابقة حتى الآن
            </div>
          ) : (
            <div className="space-y-3">
              {previousBookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="rounded-xl border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">جلسة دعم</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(booking.slot.startTime)}
                      </p>
                    </div>
                    <Badge className={bookingStatus[booking.status]?.tone ?? "bg-slate-200 text-slate-700"}>
                      {bookingStatus[booking.status]?.label ?? booking.status}
                    </Badge>
                  </div>

                  {booking.status === "COMPLETED" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      تم إكمال الجلسة بنجاح
                    </div>
                  )}

                  {booking.status === "CANCELLED" && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-rose-700">
                      <XCircle className="h-4 w-4" />
                      تم إلغاء الجلسة
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}