"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Users,
  Star,
  Calendar,
  Clock,
  Video,
  ArrowUpLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { RatingsMarquee } from "@/components/doctor/RatingMarquee";
 

const stats = [
  {
    label: "الجلسات المكتملة",
    value: "128",
    hint: "+12 هذا الشهر",
    icon: CheckCircle2,
  },
  {
    label: "عدد المستفيدين",
    value: "64",
    hint: "طالب استفاد من الدعم",
    icon: Users,
  },
  {
    label: "التقييم العام",
    value: "4.8",
    hint: "من 5 عبر 96 تقييم",
    icon: Star,
  },
];

const upcomingSessions = [
  {
    id: "1",
    name: "سارة أحمد",
    date: "اليوم",
    time: "٥:٠٠ م - ٦:٠٠ م",
    status: "مؤكدة",
  },
  {
    id: "2",
    name: "محمد علي",
    date: "غدًا",
    time: "١٠:٠٠ ص - ١١:٠٠ ص",
    status: "بانتظار الرابط",
  },
  {
    id: "3",
    name: "ندى خالد",
    date: "الجمعة",
    time: "٤:٠٠ م - ٥:٠٠ م",
    status: "مؤكدة",
  },
];

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

function initials(name: string) {
  return name.trim().split(" ")[0]?.charAt(0) ?? "؟";
}

function StarRow({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < score
              ? "h-3.5 w-3.5 fill-primary text-primary"
              : "h-3.5 w-3.5 text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

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
              <h1 className="   text-xl font-medium text-foreground">
                أهلاً د. أحمد محمود
              </h1>
              <p className="text-sm text-muted-foreground">
                نظرة سريعة على نشاطك وجلساتك القادمة
              </p>
            </div>
          </div>

          <Button   className="gap-2">
            <Link href="/doctor/bookings">
              إدارة كل الحجوزات
              <ArrowUpLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-sm text-muted-foreground">
                    {stat.label}
                  </CardDescription>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upcoming sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className=" text-lg font-medium text-foreground">
              أقرب الجلسات القادمة
            </h2>
            <Link
              href="/doctor/bookings"
              className="text-sm font-medium text-primary hover:underline"
            >
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {upcomingSessions.map((session) => (
              <Card key={session.id} className="border-border shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                      {initials(session.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium text-foreground">
                      {session.name}
                    </CardTitle>
                    <Badge
                      variant={session.status === "مؤكدة" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {session.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {session.time}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Video className="h-3.5 w-3.5" />
                    تفاصيل الجلسة
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Ratings carousel */}
        <div className="space-y-4">
          <h2 className=" text-lg font-medium text-foreground">
            آراء المستفيدين
          </h2>

          <RatingsMarquee ratings={ratings} speed={35} />
        </div>
      </div>
    </div>
  );
}