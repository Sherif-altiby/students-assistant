import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCENTS = {
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    fill: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    fill: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
} as const;

export function QuotaCard({
  title,
  used,
  limit,
  accent,
  icon,
  description,
}: {
  title: string;
  used: number;
  limit: number;
  accent: "emerald" | "rose";
  icon: ReactNode;
  description: string;
}) {
  const safeLimit = Math.max(limit, 1);
  const usedClamped = Math.min(Math.max(used, 0), safeLimit);
  const remaining = safeLimit - usedClamped;
  const isExhausted = usedClamped >= safeLimit;
  const pct = Math.round((usedClamped / safeLimit) * 100);
  const colors = ACCENTS[accent];

  // With small limits (1–6) separate pips are easier to read than a bar:
  // each pip is one session the student still has.
  const usePips = safeLimit <= 6;

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            colors.badge,
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            {isExhausted ? (
              "استخدمت كل حصتك"
            ) : (
              <>
                متبقي لك{" "}
                <span className={cn("text-xl font-extrabold tabular-nums", colors.text)}>
                  {remaining}
                </span>
              </>
            )}
          </p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {usedClamped} / {safeLimit} هذا الشهر
          </span>
        </div>

        {usePips ? (
          <div
            className="mt-3 flex gap-2"
            role="img"
            aria-label={`استخدمت ${usedClamped} من ${safeLimit}`}
          >
            {Array.from({ length: safeLimit }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 flex-1 rounded-full transition-colors motion-reduce:transition-none",
                  // used sessions are "spent" (muted), remaining ones are lit
                  i < usedClamped ? "bg-muted" : colors.fill,
                )}
              />
            ))}
          </div>
        ) : (
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn("h-full rounded-full transition-all motion-reduce:transition-none", colors.fill)}
              style={{ width: `${100 - pct}%` }}
            />
          </div>
        )}

        {isExhausted && (
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            تتجدد حصتك مع بداية الشهر القادم.
          </p>
        )}
      </div>
    </Card>
  );
}