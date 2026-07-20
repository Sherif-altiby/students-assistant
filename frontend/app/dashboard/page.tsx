"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  MessageCircleQuestion,
  ListChecks,
  Repeat,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { QuotaCard } from "@/components/QuotaCard";
import { useAuthStore } from "@/store/useAuthStore";
import { listTasks } from "@/lib/tasks";
import { listHabits } from "@/lib/habits";
import {
  CONSULTATION_MONTHLY_LIMIT,
  SUPPORT_MONTHLY_LIMIT,
  countThisMonth,
  listConsultations,
  listSupportSessions,
} from "@/lib/support";
import type { Habit } from "@/types";
import { Task } from "@/types/task";
import TaskProgressChart from "@/components/dashboard/Taskprogresschart";
import HabitProgressChart from "@/components/dashboard/Habitprogresschart";
import { useTaskStats } from "@/hooks/Usetasks";
import {
  ChartSkeleton,
  EmptyChart,
  FeaturedStats,
  SummaryStat,
} from "@/components/dashboard/home/home-page-components";
import { useHabitStats } from "@/hooks/useHabits";

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [supportUsed, setSupportUsed] = useState(0);
  const [consultationsUsed, setConsultationsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { stats: habitStats, isLoading: isHabitStatsLoading } = useHabitStats();

  const { stats, isLoading: isStatsLoading } = useTaskStats();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const results = await Promise.allSettled([
        listTasks(),
        listHabits(),
        listSupportSessions(),
        listConsultations(),
      ]);
      if (cancelled) return;

      if (results[0].status === "fulfilled") setTasks(results[0].value);
      if (results[1].status === "fulfilled") setHabits(results[1].value);
      if (results[2].status === "fulfilled")
        setSupportUsed(countThisMonth(results[2].value));
      if (results[3].status === "fulfilled")
        setConsultationsUsed(countThisMonth(results[3].value));

      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const taskPieData = [
    { name: "منجزة", value: completedTasks },
    { name: "متبقية", value: pendingTasks || 1 },
  ];

  const habitChartData = habits.map((h) => ({
    name: h.title.length > 10 ? `${h.title.slice(0, 10)}…` : h.title,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </span>
        </div>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          أهلًا، {user?.name?.split(" ")[0] ?? "بطل"}
        </h1>

        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          ملخص أدائك في المذاكرة والعادات
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FeaturedStats
          total={stats?.total ?? 0}
          longestStreak={stats?.longestStreak ?? 0}
          isLoading={isStatsLoading}
          title="المهام"
          />
        <FeaturedStats
          total={habitStats?.total ?? 0}
          longestStreak={habitStats?.longestStreak ?? 0}
          isLoading={isHabitStatsLoading}
          title="العادات"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <>
          {isLoading ? (
            <ChartSkeleton />
          ) : tasks.length === 0 ? (
            <EmptyChart message="لا توجد مهام بعد. أضف أول مهمة من صفحة المهام." />
          ) : (
            <TaskProgressChart />
          )}
        </>

        <>
          {isLoading ? (
            <ChartSkeleton />
          ) : habits.length === 0 ? (
            <EmptyChart message="لا توجد عادات بعد. أضف أول عادة من صفحة العادات." />
          ) : (
            <HabitProgressChart />
          )}
        </>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <QuotaCard
          title="الدعم النفسي"
          description="جلسة واحدة متاحة كل شهر"
          used={supportUsed}
          limit={SUPPORT_MONTHLY_LIMIT}
          accent="rose"
          icon={<HeartHandshake className="h-4 w-4" />}
        />
        <QuotaCard
          title="الاستشارات"
          description="٣ استشارات متاحة كل شهر"
          used={consultationsUsed}
          limit={CONSULTATION_MONTHLY_LIMIT}
          accent="emerald"
          icon={<MessageCircleQuestion className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}
