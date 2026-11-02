"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  ListChecks,
  MessageCircleQuestion,
  Repeat,
} from "lucide-react";
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
import StudyTableProgressChart from "@/components/dashboard/StudyTableProgressChart";
import DashboardStudyTables from "@/components/dashboard/DashboardStudyTables";
import { useTaskStats } from "@/hooks/Usetasks";
import {
  ChartSkeleton,
  EmptyChart,
  FeaturedStats,
} from "@/components/dashboard/home/home-page-components";
import { useHabitStats } from "@/hooks/useHabits";

// One short, personal line under the greeting, based on the student's own streak.
function getMotivation(longestStreak: number, hasData: boolean) {
  if (!hasData) return "ابدأ اليوم بإضافة أول مهمة، الخطوة الأولى هي الأصعب.";
  if (longestStreak >= 14) return `سلسلة ${longestStreak} يومًا! انضباطك هو سر التفوق 🔥`;
  if (longestStreak >= 7) return `أسبوع كامل من الالتزام. حافظ على السلسلة 🔥`;
  if (longestStreak >= 3) return `${longestStreak} أيام متتالية، أنت تبني عادة قوية 💪`;
  return "مذاكرة اليوم أسهل من تراكم الغد. ابدأ بمهمة صغيرة.";
}

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

  const firstName = user?.name?.split(" ")[0] ?? "بطل";
  const bestStreak = Math.max(
    stats?.longestStreak ?? 0,
    habitStats?.longestStreak ?? 0,
  );
  const hasData = tasks.length > 0 || habits.length > 0;

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6">
      {/* ------------------------------ Greeting ------------------------------ */}
      <header className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary font-display text-2xl font-extrabold text-primary-foreground"
        >
          {firstName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {new Date().toLocaleDateString("ar-EG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            أهلًا، {firstName} 👋
          </h1>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {getMotivation(bestStreak, hasData)}
          </p>
        </div>
      </header>

      {/* ------------------------------ Quick numbers ------------------------------ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FeaturedStats
          total={stats?.total ?? 0}
          longestStreak={stats?.longestStreak ?? 0}
          isLoading={isStatsLoading}
          title="المهام"
          icon={<ListChecks className="h-6 w-6" />}
        />
        <FeaturedStats
          total={habitStats?.total ?? 0}
          longestStreak={habitStats?.longestStreak ?? 0}
          isLoading={isHabitStatsLoading}
          title="العادات"
          icon={<Repeat className="h-6 w-6" />}
        />
      </div>

      {/* ------------------------------ Progress charts ------------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? ( <ChartSkeleton /> ) : tasks.length === 0 ? (
          <EmptyChart
            emoji="✅"
            message="لا توجد مهام بعد. أضف أول مهمة من صفحة المهام وابدأ رحلة الإنجاز."
          />
        ) : (
          <TaskProgressChart />
        )}

        {isLoading ? (
          <ChartSkeleton />
        ) : habits.length === 0 ? (
          <EmptyChart
            emoji="🔥"
            message="لا توجد عادات بعد. أضف أول عادة من صفحة العادات وابنِ سلسلتك."
          />
        ) : (
          <HabitProgressChart />
        )}
      </div>

      <StudyTableProgressChart />

      <DashboardStudyTables />

      {/* ------------------------------ Support ------------------------------ */}
      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-foreground">
          الدعم المتاح لك هذا الشهر
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <QuotaCard
            title="الدعم النفسي"
            description="جلسة واحدة متاحة كل شهر"
            used={supportUsed}
            limit={SUPPORT_MONTHLY_LIMIT}
            accent="rose"
            icon={<HeartHandshake className="h-5 w-5" />}
          />
          <QuotaCard
            title="الاستشارات"
            description="٣ استشارات متاحة كل شهر"
            used={consultationsUsed}
            limit={CONSULTATION_MONTHLY_LIMIT}
            accent="emerald"
            icon={<MessageCircleQuestion className="h-5 w-5" />}
          />
        </div>
      </section>
    </div>
  );
}