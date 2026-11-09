import { Task } from "@/types/task";

interface StatsCardsProps {
  tasks: Task[];
}

const nf = new Intl.NumberFormat("ar-EG");

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function statusMessage(total: number, percent: number) {
  if (total === 0) return "أضف مهمتك الأولى لتبدأ";
  if (percent === 100) return "أنجزت كل مهام اليوم";
  if (percent === 0) return "ابدأ بأول مهمة";
  if (percent < 50) return "بداية جيدة، أكمل";
  return "اقتربت من إنهاء مهامك";
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isDone = total > 0 && percent === 100;

  const stats = [
    { label: "إجمالي المهام", value: total, highlight: false },
    { label: "تم إنجازها", value: completed, highlight: true },
    { label: "المتبقي", value: remaining, highlight: false },
  ];

  return (
    <section
      aria-label="ملخص تقدمك اليوم"
      className={[
        "flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-8",
        "motion-safe:transition-colors motion-safe:duration-300",
        isDone ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-card",
      ].join(" ")}
    >
      {/* Progress ring */}
      <div className="flex items-center gap-4">
        <div
          className="relative h-[76px] w-[76px] shrink-0"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="نسبة الإنجاز"
        >
          <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
            <circle
              cx="38"
              cy="38"
              r={RADIUS}
              fill="none"
              strokeWidth="7"
              className="stroke-muted"
            />
            <circle
              cx="38"
              cy="38"
              r={RADIUS}
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
              className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-semibold tabular-nums text-foreground">
            {nf.format(percent)}٪
          </span>
        </div>

        <div className="sm:w-40">
          <p className="text-sm font-semibold text-foreground">
            {statusMessage(total, percent)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {total === 0
              ? "لا توجد مهام بعد"
              : `${nf.format(completed)} من ${nf.format(total)} اكتملت`}
          </p>
        </div>
      </div>

      {/* Numbers */}
      <dl className="grid flex-1 grid-cols-3 border-t border-border/70 pt-4 sm:border-t-0 sm:pt-0">
        {stats.map(({ label, value, highlight }) => (
          <div
            key={label}
            className="space-y-1 border-border/70 px-3 border-s first:border-s-0 first:ps-0 sm:px-6"
          >
            <dt className="text-xs font-medium text-muted-foreground">
              {label}
            </dt>
            <dd
              className={[
                "text-3xl font-semibold tabular-nums tracking-tight",
                highlight && value > 0 ? "text-primary" : "text-foreground",
              ].join(" ")}
            >
              {nf.format(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}