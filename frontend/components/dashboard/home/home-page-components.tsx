import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, ListChecks, Rocket } from "lucide-react";

const formatNumber = (n: number) => n.toLocaleString("en-US");

function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-pulse rounded-md bg-muted align-middle motion-reduce:animate-none",
        className,
      )}
    />
  );
}

function LoadingLabel() {
  return <span className="sr-only">جارٍ التحميل</span>;
}

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
    <Card
      aria-busy={isLoading}
      className="relative gap-0 overflow-hidden border-border p-0 shadow-sm"
    >
      {/* Top: the main number */}
      <div className="flex items-center gap-4 p-5 sm:p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground ring-4 ring-primary/10">
          {icon ?? <ListChecks className="h-6 w-6" aria-hidden="true" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">
            إجمالي {title}
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold leading-none tabular-nums text-foreground sm:text-5xl">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-16 sm:h-11" />
                <LoadingLabel />
              </>
            ) : (
              formatNumber(total)
            )}
          </p>
        </div>
      </div>

      {/* Bottom: streak strip */}
      <div
        className={cn(
          "flex items-center gap-3 border-t px-5 py-3 sm:px-6",
          hasStreak
            ? "border-amber-500/20 bg-amber-500/10"
            : "border-border bg-muted/40",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            hasStreak ? "bg-amber-500/20" : "bg-muted",
          )}
        >
          <Flame
            aria-hidden="true"
            className={cn(
              "h-4 w-4",
              hasStreak
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground/60",
            )}
          />
        </span>

        {isLoading ? (
          <Skeleton className="h-4 w-28" />
        ) : hasStreak ? (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <p className="truncate text-sm font-medium text-muted-foreground">
              أطول سلسلة إنجاز
            </p>
            <p className="shrink-0 rounded-full bg-background/70 px-3 py-1 text-sm font-bold text-foreground ring-1 ring-amber-500/25">
              <span className="tabular-nums">{formatNumber(longestStreak)}</span>{" "}
              يوم
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            ابدأ سلسلتك من اليوم
          </p>
        )}
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="h-60 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
    >
      <LoadingLabel />
    </div>
  );
}

export function EmptyChart({
  message,
  icon,
  action,
}: {
  message: string;
  /** Any icon node. Defaults to a rocket icon. */
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/[0.03] px-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
        {icon ?? <Rocket className="h-7 w-7" aria-hidden="true" />}
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      {action}
    </div>
  );
}

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
        "flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-3.5 py-3",
        tone === "primary"
          ? "border-primary/25 bg-primary/10"
          : "border-border bg-muted/40",
      )}
    >
      <span className="truncate text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-lg font-extrabold leading-none tabular-nums",
          tone === "primary" ? "text-primary" : "text-foreground",
        )}
      >
        {typeof value === "number" ? formatNumber(value) : value}
        {suffix && (
          <span className="ms-1 text-xs font-bold text-muted-foreground">
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
  size = "md",
}: {
  value: number;
  className?: string;
  barClassName?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "sm" && "h-1.5",
        size === "md" && "h-2",
        size === "lg" && "h-3",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none",
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
      aria-busy={isLoading}
      className={cn(
        "flex flex-row items-center gap-3.5 p-4 shadow-sm",
        highlight ? "border-primary/30 bg-primary/5" : "border-border",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          highlight
            ? "bg-primary text-primary-foreground ring-4 ring-primary/10"
            : "bg-accent text-accent-foreground",
        )}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="font-display text-2xl font-extrabold leading-none tabular-nums text-foreground">
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-10" />
              <LoadingLabel />
            </>
          ) : (
            <>
              {formatNumber(value)}
              {suffix && (
                <span className="ms-1 text-sm font-bold text-muted-foreground">
                  {suffix}
                </span>
              )}
            </>
          )}
        </p>
        <p className="mt-1.5 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}