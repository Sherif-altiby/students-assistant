"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

const PIE_COLORS = ["var(--chart-2)", "var(--muted)"];

export default function DashboardOverviewPage() {
  const user = useAuthStore((s) => s.user);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [supportUsed, setSupportUsed] = useState(0);
  const [consultationsUsed, setConsultationsUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          أهلًا، {user?.name?.split(" ")[0] ?? "بطل"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه نظرة سريعة على مذاكرتك وعاداتك هذا الأسبوع
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat
          icon={<ListChecks className="h-4 w-4" />}
          label="إجمالي المهام"
          value={tasks.length}
        />
        <SummaryStat
          icon={<ListChecks className="h-4 w-4" />}
          label="مهام منجزة"
          value={completedTasks}
        />
        <SummaryStat
          icon={<Repeat className="h-4 w-4" />}
          label="عادات نشطة"
          value={habits.length}
        />
        <SummaryStat
          icon={<Repeat className="h-4 w-4" />}
          label="أطول تتابع (Streak)"
          value={habits.reduce((max, h) => Math.max(max, 0), 0)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-base font-bold text-foreground">
            حالة المهام
          </h2>
          {isLoading ? (
            <ChartSkeleton />
          ) : tasks.length === 0 ? (
            <EmptyChart message="لا توجد مهام بعد. أضف أول مهمة من صفحة المهام." />
          ) : (
            <TaskProgressChart />
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-base font-bold text-foreground">
            تتابع العادات
          </h2>
          {isLoading ? (
            <ChartSkeleton />
          ) : habits.length === 0 ? (
            <EmptyChart message="لا توجد عادات بعد. أضف أول عادة من صفحة العادات." />
          ) : (
            <HabitProgressChart />
          )}
        </Card>
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

function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
        {icon}
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function ChartSkeleton() {
  return <div className="h-[240px] animate-pulse rounded-xl bg-muted" />;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
