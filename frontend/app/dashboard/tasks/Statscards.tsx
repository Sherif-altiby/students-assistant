import { Task } from "@/types/task";
import { ListChecks, CircleCheckBig, Clock } from "lucide-react";
 
interface StatsCardsProps {
  tasks: Task[];
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const completed = tasks.filter((t) => t.completed).length;
  const remaining = tasks.length - completed;

  const stats = [
    {
      label: "إجمالي المهام",
      value: tasks.length,
      icon: ListChecks,
      tone: "default" as const,
    },
    {
      label: "تم إنجازها",
      value: completed,
      icon: CircleCheckBig,
      tone: "primary" as const,
    },
    {
      label: "المتبقي",
      value: remaining,
      icon: Clock,
      tone: "default" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <p
                className={`text-3xl font-semibold tracking-tight ${
                  tone === "primary" ? "text-primary" : "text-foreground"
                }`}
              >
                {value}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                tone === "primary"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
