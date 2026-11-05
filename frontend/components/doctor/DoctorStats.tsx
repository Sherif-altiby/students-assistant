"use client";

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useDoctorStats } from "@/hooks/useSupport";
import { DOCTOR_STATS_METRICS } from "@/constants";
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

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {DOCTOR_STATS_METRICS.map((stat) => {
        const Icon = stat.icon;
        const hint =
          stat.hintKey === "completedSessions"
            ? `${stats.completedSessions} جلسة مكتملة حتى الآن`
            : stat.hintKey === "totalBeneficiaries"
              ? "طالب استفاد من الدعم"
              : stats.ratingLabel;

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
                {stats[stat.key]}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
