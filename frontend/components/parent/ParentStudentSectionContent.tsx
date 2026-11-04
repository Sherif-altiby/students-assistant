import { BookOpen, Clock3, ListTodo, Repeat2, Table2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ParentProgressCharts } from "@/components/parent/ParentProgressCharts";
import type { ParentOverview } from "@/types/parent";

export type ParentStudentSection =
  | "analytics"
  | "tasks"
  | "habits"
  | "tables"
  | "lessons";

function SectionHeading({
  title,
  description,
  icon,
  count,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  count?: number;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {count !== undefined && <Badge variant="secondary">{count}</Badge>}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function EmptySection({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function TasksSection({ overview }: { overview: ParentOverview }) {
  return (
    <section>
      <SectionHeading
        title="المهام"
        description="المهام المسجلة وعدد مرات إنجاز كل مهمة."
        icon={<ListTodo className="h-5 w-5" />}
        count={overview.tasks.length}
      />
      {overview.tasks.length === 0 ? (
        <EmptySection>لا توجد مهام مسجلة.</EmptySection>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.tasks.map((task) => (
            <Card
              key={task.id}
              className="gap-3 border border-border p-4 shadow-none ring-0"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-card-foreground">{task.title}</h3>
                <Badge variant="outline">
                  {task.frequency === "EVERY_DAY" ? "يومية" : "لليوم"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {task._count.histories} إنجاز
              </p>
              {task.histories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  آخر إنجاز:{" "}
                  {new Date(task.histories[0].completedAt).toLocaleDateString(
                    "ar-EG",
                  )}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function HabitsSection({ overview }: { overview: ParentOverview }) {
  return (
    <section>
      <SectionHeading
        title="العادات"
        description="العادات اليومية ومؤشر إنجازاتها."
        icon={<Repeat2 className="h-5 w-5" />}
        count={overview.habits.length}
      />
      {overview.habits.length === 0 ? (
        <EmptySection>لا توجد عادات مسجلة.</EmptySection>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.habits.map((habit) => (
            <Card
              key={habit.id}
              className="gap-3 border border-border p-4 shadow-none ring-0"
            >
              <h3 className="font-semibold text-card-foreground">{habit.title}</h3>
              <p className="text-sm text-muted-foreground">
                {habit._count.completions} إنجاز
              </p>
              {habit.completions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  آخر إنجاز:{" "}
                  {new Date(
                    habit.completions[0].completedAt,
                  ).toLocaleDateString("ar-EG")}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function TablesSection({ overview }: { overview: ParentOverview }) {
  return (
    <section>
      <SectionHeading
        title="جداول المذاكرة"
        description="الجلسات المجدولة وحالة إنجازها لكل يوم."
        icon={<Table2 className="h-5 w-5" />}
        count={overview.studyTables.length}
      />
      {overview.studyTables.length === 0 ? (
        <EmptySection>لا توجد جداول مذاكرة مسجلة.</EmptySection>
      ) : (
        <div className="space-y-4">
          {overview.studyTables.map((table) => (
            <Card
              key={table.id}
              className="gap-4 border border-border p-4 shadow-none ring-0 sm:p-5"
            >
              <div>
                <h3 className="font-bold text-card-foreground">{table.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(table.startDate).toLocaleDateString("ar-EG")}
                  {" — "}
                  {new Date(table.endDate).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {table.days.map((day) => (
                  <div key={day.id} className="rounded-xl bg-muted/40 p-3">
                    <p className="mb-3 text-sm font-semibold text-foreground">
                      {new Date(day.date).toLocaleDateString("ar-EG", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    {day.sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد جلسات.</p>
                    ) : (
                      <ul className="space-y-2">
                        {day.sessions.map((session) => (
                          <li
                            key={session.id}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0">
                              <span className="font-medium text-foreground">
                                {session.subject}
                              </span>
                              {session.lesson && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {session.lesson}
                                </span>
                              )}
                            </span>
                            <Badge
                              variant={session.completedAt ? "default" : "outline"}
                            >
                              {session.completedAt ? "مكتملة" : "غير مكتملة"}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function LessonsSection({ overview }: { overview: ParentOverview }) {
  return (
    <section>
      <SectionHeading
        title="الدروس"
        description="مواعيد الدروس المسجلة وسجل الدروس المكتملة."
        icon={<BookOpen className="h-5 w-5" />}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-4 border border-border p-4 shadow-none ring-0">
          <h3 className="font-semibold text-card-foreground">جدول الدروس</h3>
          {overview.lessons.schedule.length === 0 ? (
            <EmptySection>لا توجد دروس مجدولة.</EmptySection>
          ) : (
            <ul className="space-y-3">
              {overview.lessons.schedule.map((lesson) => (
                <li key={lesson.id} className="flex items-start gap-3">
                  <Clock3
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-foreground">{lesson.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {lesson.dayOfWeek} · {lesson.startTime}–{lesson.endTime}
                      {lesson.teacher ? ` · ${lesson.teacher}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-4 border border-border p-4 shadow-none ring-0">
          <h3 className="font-semibold text-card-foreground">
            الدروس المكتملة (الأحدث)
          </h3>
          {overview.lessons.completed.length === 0 ? (
            <EmptySection>لا توجد دروس مكتملة.</EmptySection>
          ) : (
            <ul className="space-y-3">
              {overview.lessons.completed.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-foreground">
                      {item.lesson.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.lesson.unit.subject.title} · {item.lesson.unit.title}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.completedAt).toLocaleDateString("ar-EG")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

export function ParentStudentSectionContent({
  section,
  overview,
}: {
  section: ParentStudentSection;
  overview: ParentOverview;
}) {
  switch (section) {
    case "analytics":
      return <ParentProgressCharts overview={overview} />;
    case "tasks":
      return <TasksSection overview={overview} />;
    case "habits":
      return <HabitsSection overview={overview} />;
    case "tables":
      return <TablesSection overview={overview} />;
    case "lessons":
      return <LessonsSection overview={overview} />;
  }
}
