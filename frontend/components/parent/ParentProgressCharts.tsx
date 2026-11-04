"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import type { ParentOverview } from "@/types/parent";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function shortLabel(value: string, maxLength = 12) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 gap-4 border border-border p-4 shadow-none ring-0 sm:p-5">
      <div>
        <h3 className="font-bold text-card-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </Card>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
      لا توجد بيانات كافية لعرض الرسم البياني.
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-md">
      <p className="mb-2 font-semibold text-popover-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.name}: {item.value ?? 0}
        </p>
      ))}
    </div>
  );
}

function activityByDay(overview: ParentOverview) {
  const activity = new Map<string, { tasks: number; habits: number }>();
  const getDay = (date: string) => {
    const key = date.slice(0, 10);
    const current = activity.get(key) ?? { tasks: 0, habits: 0 };
    activity.set(key, current);
    return current;
  };

  overview.taskHistory.forEach((entry) => {
    getDay(entry.date).tasks += 1;
  });
  overview.habits.forEach((habit) => {
    habit.completions.forEach((completion) => {
      getDay(completion.date).habits += 1;
    });
  });

  return [...activity.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(-14)
    .map(([date, counts]) => ({
      date: new Date(`${date}T00:00:00Z`).toLocaleDateString("ar-EG", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      ...counts,
    }));
}

export function ParentProgressCharts({
  overview,
}: {
  overview: ParentOverview;
}) {
  const activityData = activityByDay(overview);
  const taskData = overview.tasks
    .map((task) => ({
      title: shortLabel(task.title),
      completed: task._count.histories,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 8);
  const habitData = overview.habits
    .map((habit) => ({
      title: shortLabel(habit.title),
      completed: habit._count.completions,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 8);
  const tableData = overview.studyTables
    .map((table) => {
      const sessions = table.days.flatMap((day) => day.sessions);
      return {
        title: shortLabel(table.title),
        completed: sessions.filter((session) => session.completedAt).length,
        remaining: sessions.filter((session) => !session.completedAt).length,
      };
    })
    .slice(0, 8);
  const lessonCounts = new Map<string, number>();
  overview.lessons.completed.forEach(({ lesson }) => {
    lessonCounts.set(
      lesson.unit.subject.title,
      (lessonCounts.get(lesson.unit.subject.title) ?? 0) + 1,
    );
  });
  const lessonData = [...lessonCounts.entries()]
    .map(([title, completed]) => ({ title: shortLabel(title), completed }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 8);
  const sessionCounts = new Map<string, number>();
  overview.studyTables.forEach((table) => {
    table.days.forEach((day) => {
      day.sessions.forEach((session) => {
        sessionCounts.set(
          session.subject,
          (sessionCounts.get(session.subject) ?? 0) + 1,
        );
      });
    });
  });
  const sessionData = [...sessionCounts.entries()]
    .map(([title, sessions]) => ({ title: shortLabel(title), sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);
  const lessonActivity = new Map<string, number>();
  overview.lessons.completed.forEach((item) => {
    const month = item.completedAt.slice(0, 7);
    lessonActivity.set(month, (lessonActivity.get(month) ?? 0) + 1);
  });
  const lessonTrendData = [...lessonActivity.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, completed]) => ({
      month: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("ar-EG", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
      completed,
    }));
  const completionMix = [
    { name: "المهام", value: overview.summary.completedTaskCount },
    { name: "العادات", value: overview.summary.habitCompletionCount },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        title="نشاط الإنجاز"
        description="المهام والعادات المكتملة حسب الأيام المتاحة في السجل."
      >
        {activityData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  name="المهام"
                  stroke={CHART_COLORS[0]}
                  fill={CHART_COLORS[0]}
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="habits"
                  name="العادات"
                  stroke={CHART_COLORS[1]}
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.18}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="إنجاز المهام"
        description="عدد مرات إكمال كل مهمة."
      >
        {taskData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="مرات الإكمال" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="الالتزام بالعادات"
        description="عدد مرات إكمال كل عادة."
      >
        {habitData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="completed"
                  name="مرات الإكمال"
                  fill={CHART_COLORS[1]}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="إنجاز جداول المذاكرة"
        description="الجلسات المكتملة والمتبقية في كل جدول."
      >
        {tableData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tableData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="مكتملة" stackId="sessions" fill={CHART_COLORS[1]} />
                <Bar dataKey="remaining" name="متبقية" stackId="sessions" fill="var(--study-progress-remaining)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="الدروس المكتملة حسب المادة"
        description="توزيع أحدث الدروس المكتملة (حتى 30 درسًا) لكل مادة."
      >
        {lessonData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lessonData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="دروس مكتملة" fill={CHART_COLORS[4]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="توزيع الإنجازات"
        description="مقارنة إجمالي إنجازات المهام والعادات."
      >
        {completionMix.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="flex h-56 min-w-0 items-center justify-center" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltip />} />
                <Pie
                  data={completionMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {completionMix.map((item, index) => (
                    <Cell key={item.name} fill={CHART_COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="الجلسات حسب المادة"
        description="عدد الجلسات المدرجة في جداول المذاكرة لكل مادة."
      >
        {sessionData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="title"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="sessions"
                  name="جلسات"
                  fill={CHART_COLORS[2]}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="تطور إنجاز الدروس"
        description="الدروس المكتملة شهريًا ضمن أحدث 30 إنجازًا."
      >
        {lessonTrendData.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-56 min-w-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lessonTrendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="دروس مكتملة"
                  stroke={CHART_COLORS[4]}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS[4], r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
