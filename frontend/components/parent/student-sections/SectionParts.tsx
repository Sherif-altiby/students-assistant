import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatArabicNumber } from "./formatters";

export function SectionHeading({
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
    <div className="mb-6 flex items-start gap-3 border-b border-border pb-4">
      {/* Icon badge with soft gradient + ring */}
      <span
        aria-hidden="true"
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-primary/15 to-primary/5 text-primary",
          "ring-1 ring-primary/15 ring-inset",
          "shadow-sm shadow-primary/5",
          "transition-transform duration-300 motion-reduce:transition-none",
        )}
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </h2>

          {count !== undefined && (
            <Badge
              variant="secondary"
              className={cn(
                "h-6 min-w-6 justify-center rounded-full px-2",
                "bg-primary/10 text-primary",
                "tabular-nums font-semibold",
                "ring-1 ring-primary/15 ring-inset",
              )}
            >
              {formatArabicNumber(count)}
            </Badge>
          )}
        </div>

        <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export function EmptySection({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center gap-3 overflow-hidden",
        "rounded-xl border border-dashed border-border",
        "bg-gradient-to-b from-muted/30 to-muted/10",
        "px-4 py-10 text-center",
        "transition-colors duration-300",
        "hover:border-primary/30 hover:bg-primary/[0.03]",
      )}
    >
      {/* Decorative blurred glow behind icon */}
      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-6 h-16 w-16 rounded-full",
            "bg-primary/10 blur-2xl",
            "transition-opacity duration-500",
            "opacity-60 group-hover:opacity-100",
          )}
        />
      )}

      {icon && (
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full",
            "bg-background text-muted-foreground",
            "ring-1 ring-border",
            "shadow-sm",
            "transition-all duration-300 motion-reduce:transition-none",
            "group-hover:text-primary group-hover:ring-primary/30 group-hover:scale-105",
          )}
        >
          {icon}
        </span>
      )}

      <p className="relative max-w-prose text-sm leading-6 text-muted-foreground">
        {children}
      </p>
    </div>
  );
}