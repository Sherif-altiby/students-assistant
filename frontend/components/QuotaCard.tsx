import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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
  icon: React.ReactNode;
  description: string;
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isExhausted = used >= limit;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            accent === "emerald" 
              ? "bg-primary/10 text-primary" 
              : "bg-destructive/10 text-destructive"
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-2xl font-extrabold text-foreground">{used}</span>
          <span className="text-sm text-muted-foreground">/ {limit} هذا الشهر</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              accent === "emerald" ? "bg-primary" : "bg-destructive"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isExhausted && (
          <p className="mt-2 text-xs font-medium text-destructive">
            وصلت للحد المسموح به هذا الشهر
          </p>
        )}
      </div>
    </Card>
  );
}