"use client";

import { CheckCircle2, Users, Star } from "lucide-react";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useDoctorStats } from "@/hooks/useSupport";
import { DoctorStatsSkeleton } from "./DoctorStatsSkeleton";
import { DoctorStatsEmpty } from "./DoctorStatsEmpty";

export function DoctorStats() {
  const { stats, isLoading, error } = useDoctorStats();

  if (isLoading) {
    return <DoctorStatsSkeleton />;
  }

  if (error || !stats) {
    return <DoctorStatsEmpty message={error ?? undefined} />;
  }

  const items = [
    {
      label: "الجلسات المكتملة",
      value: String(stats.completedSessions),
      hint: `${stats.completedSessions} جلسة مكتملة حتى الآن`,
      icon: CheckCircle2,
    },
    {
      label: "عدد المستفيدين",
      value: String(stats.totalBeneficiaries),
      hint: "طالب استفاد من الدعم",
      icon: Users,
    },
    {
      label: "التقييم العام",
      value: String(stats.averageRating),
      hint: stats.ratingLabel,
      icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((stat) => {
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
  );
}