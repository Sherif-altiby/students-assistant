"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import MainButton from "@/components/ui/MainButton";
import { RatingsMarquee } from "@/components/doctor/RatingMarquee";
import { DoctorStats } from "@/components/doctor/DoctorStats";
import { UpcomingSessions } from "@/components/doctor/UpcomingSessions";
import { useDoctorRatings } from "@/hooks/useSupport";
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

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground">
              أهلاً، {name}
            </h1>
            <p className="text-sm text-muted-foreground">
              نظرة سريعة على نشاطك وجلساتك القادمة
            </p>
          </div>
          <MainButton
            render={<Link href="/doctor/bookings" />}
            title="إدارة كل الحجوزات"
          />
        </div>

        <DoctorStats />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-foreground">
              أقرب الجلسات القادمة
            </h2>
            <Link
              href="/doctor/bookings"
              className="text-sm font-medium text-primary hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          <UpcomingSessions />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            آراء المستفيدين
          </h2>

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
        </div>
      </div>
    </div>
  );
}
