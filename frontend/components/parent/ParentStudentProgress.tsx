import {
  BookOpen,
  CheckCircle2,
  ListTodo,
  Repeat2,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ParentOverview } from "@/types/parent";

const METRICS: Array<{
  key: keyof ParentOverview["summary"];
  label: string;
  icon: LucideIcon;
  totalKey?: keyof ParentOverview["summary"];
}> = [
  {
    key: "completedTaskCount",
    label: "إنجازات المهام",
    icon: ListTodo,
  },
  {
    key: "habitCompletionCount",
    label: "إنجازات العادات",
    icon: Repeat2,
  },
  {
    key: "completedStudySessionCount",
    label: "جلسات مكتملة",
    icon: Table2,
    totalKey: "studySessionCount",
  },
  {
    key: "completedLessonCount",
    label: "دروس مكتملة",
    icon: BookOpen,
  },
] as const;

export function ParentStudentProgress({
  overview,
}: {
  overview: ParentOverview;
}) {
  return (
    <div dir="rtl" className="space-y-6 p-4 sm:p-6">
      <section>
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-bold text-foreground">ملخص التقدم</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {METRICS.map(({ key, label, icon: Icon, totalKey }) => {
            const value = overview.summary[key];
            const total = totalKey ? overview.summary[totalKey] : null;
            return (
              <Card
                key={key}
                className="flex-row items-center gap-3 border border-border p-4 shadow-none ring-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-card-foreground">
                    {value}
                    {total !== null && (
                      <span className="text-sm font-medium text-muted-foreground">
                        {" "}
                        / {total}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="gap-3 border border-primary/15 bg-primary/[0.03] p-5 shadow-none ring-0">
        <h2 className="font-bold text-card-foreground">نظرة سريعة</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          لدى الطالب {overview.summary.taskCount} مهام و{overview.summary.habitCount}{" "}
          عادات و{overview.summary.studyTableCount} جداول مذاكرة. استخدم القائمة
          الجانبية لفتح تفاصيل كل قسم أو مراجعة الرسوم البيانية.
        </p>
      </Card>
    </div>
  );
}
