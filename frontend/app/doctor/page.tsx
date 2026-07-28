"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingsMarquee } from "@/components/doctor/RatingMarquee";
import { DoctorStats } from "@/components/doctor/DoctorStats";
import { UpcomingSessions } from "@/components/doctor/UpcomingSessions";

const ratings = [
  {
    id: "1",
    name: "سارة أحمد",
    score: 5,
    comment: "الجلسة كانت مريحة جدًا وساعدتني أرتب أفكاري قبل الامتحانات.",
  },
  {
    id: "2",
    name: "محمد علي",
    score: 4,
    comment: "الدكتور كان متفهم وأعطاني خطوات عملية للتعامل مع القلق.",
  },
  {
    id: "3",
    name: "ندى خالد",
    score: 5,
    comment: "أول مرة أحس إني اتسمعت فعلاً، شكرًا على الوقت والصبر.",
  },
  {
    id: "4",
    name: "عمر حسن",
    score: 5,
    comment: "نصائح بسيطة وقابلة للتطبيق، حسّت بفرق من نفس اليوم.",
  },
];

export default function DoctorDashboardPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage src="" alt="د. أحمد محمود" />
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                أم
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-medium text-foreground">
                أهلاً د. أحمد محمود
              </h1>
              <p className="text-sm text-muted-foreground">
                نظرة سريعة على نشاطك وجلساتك القادمة
              </p>
            </div>
          </div>

          <Button className="gap-2">
            <Link href="/doctor/bookings" className="px-2">
              إدارة كل الحجوزات
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <DoctorStats />

        {/* Upcoming sessions */}
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

        {/* Ratings carousel */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            آراء المستفيدين
          </h2>

          <RatingsMarquee ratings={ratings} speed={35} />
        </div>
      </div>
    </div>
  );
}