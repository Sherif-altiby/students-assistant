import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, ListChecks } from "lucide-react";

export function FeaturedStats({
  total,
  longestStreak,
  isLoading = false,
  title
}: {
  total: number;
  longestStreak: number;
  isLoading?: boolean;
  title: string
}) {
  return (
    <Card className="grid  grid-cols-1 gap-4  ">
      {/* Total tasks */}
      <Card className="relative overflow-hidden border-border p-5">
        <ListChecks className="pointer-events-none absolute -left-3 -top-3 h-24 w-24 text-primary/[0.06]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ListChecks className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold leading-none text-foreground">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" />
              ) : (
                total
              )}
            </p>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              إجمالي {title}
            </p>
          </div>
        </div>
      </Card>

      {/* Longest streak */}
      <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-5">
        <Flame className="pointer-events-none absolute -left-3 -top-3 h-24 w-24 text-amber-500/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-3xl font-extrabold leading-none text-foreground">
              {isLoading ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <>
                  {longestStreak}
                  <span className="text-lg font-bold text-muted-foreground">
                    {" "}
                    يوم
                  </span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              أطول سلسلة إنجاز
            </p>
          </div>
        </div>
      </Card>
    </Card>
  );
}

export function ChartSkeleton() {
  return <div className="h-60 animate-pulse rounded-xl bg-muted" />;
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/5 text-center transition-all hover:bg-muted/10">
      <div className="text-4xl mb-2 opacity-50">📝</div>
      <p className="max-w-xs text-sm text-muted-foreground px-4">{message}</p>
    </div>
  );
}

export function SummaryStat({
  icon,
  label,
  value,
  suffix = "",
  isLoading = false,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  isLoading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex items-center gap-3",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          highlight
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground",
        )}
      >
        {icon}
      </div>
      <div>
        <p className="font-display text-xl font-extrabold text-foreground">
          {isLoading ? (
            <span className="inline-block h-5 w-8 animate-pulse rounded bg-muted" />
          ) : (
            <>
              {value}
              {suffix}
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
