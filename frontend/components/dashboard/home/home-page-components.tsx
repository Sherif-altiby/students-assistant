import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, ListChecks } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  FeaturedStats: total count + longest streak in ONE card (no nested cards)  */
/* -------------------------------------------------------------------------- */
export function FeaturedStats({
  total,
  longestStreak,
  isLoading = false,
  title,
  icon,
}: {
  total: number;
  longestStreak: number;
  isLoading?: boolean;
  title: string;
  icon?: ReactNode;
}) {
  const hasStreak = longestStreak > 0;

  return (
    <Card className="relative gap-0 overflow-hidden border-border p-0">
      {/* Top: the main number */}
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          {icon ?? <ListChecks className="h-6 w-6" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            إجمالي {title}
          </p>
          <p className="font-display text-4xl font-extrabold leading-tight text-foreground">
            {isLoading ? (
              <span className="inline-block h-9 w-14 animate-pulse rounded-lg bg-muted align-middle" />
            ) : (
              total
            )}
          </p>
        </div>
      </div>

      {/* Bottom: streak strip */}
      <div
        className={cn(
          "flex items-center gap-3 border-t px-5 py-3.5",
          hasStreak
            ? "border-amber-500/20 bg-amber-500/10"
            : "border-border bg-muted/40",
        )}
      >
        <Flame
          className={cn(
            "h-5 w-5 shrink-0",
            hasStreak ? "text-amber-500" : "text-muted-foreground/50",
          )}
        />
        <p className="text-sm font-semibold text-foreground">
          {isLoading ? (
            <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted align-middle" />
          ) : hasStreak ? (
            <>
              أطول سلسلة إنجاز:{" "}
              <span className="tabular-nums">{longestStreak}</span> يوم
            </>
          ) : (
            <span className="font-medium text-muted-foreground">
              ابدأ سلسلتك من اليوم
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Loading / empty states                                                     */
/* -------------------------------------------------------------------------- */
export function ChartSkeleton() {
  return <div className="h-60 animate-pulse rounded-2xl bg-muted" />;
}

export function EmptyChart({
  message,
  emoji = "🚀",
  action,
}: {
  message: string;
  emoji?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl">
        {emoji}
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small reusable pieces                                                      */
/* -------------------------------------------------------------------------- */
export function StatChip({
  label,
  value,
  suffix = "",
  tone = "default",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  tone?: "default" | "primary";
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-0.5 rounded-xl border px-3.5 py-2.5",
        tone === "primary"
          ? "border-primary/25 bg-primary/10"
          : "border-border bg-muted/40",
      )}
    >
      <span className="text-[11px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="font-display text-lg font-extrabold tabular-nums text-foreground">
        {value}
        {suffix && (
          <span className="mr-0.5 text-xs font-bold text-muted-foreground">
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  barClassName,
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none",
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
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
  icon: ReactNode;
  label: string;
  value: number;
  suffix?: string;
  isLoading?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-row items-center gap-3 p-4",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
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