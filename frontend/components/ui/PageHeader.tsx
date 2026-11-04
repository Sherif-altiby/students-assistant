import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode; // أزرار أو عناصر تفاعلية على الجانب الآخر
  /** Optional small label rendered above the title (e.g. breadcrumb / eyebrow) */
  eyebrow?: string;
  /** Optional decorative icon shown next to the title */
  icon?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <header
      dir="rtl"
      className={cn(
        "relative flex flex-col gap-4 pb-6 sm:flex-row-reverse sm:items-start sm:justify-between",
        // subtle bottom separator that fades out
        "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:h-px",
        "before:bg-gradient-to-l before:from-transparent before:via-border before:to-transparent",
        className,
      )}
    >
      {/* Text block */}
      <div className="min-w-0 flex-1 space-y-1.5 text-right">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
            {eyebrow}
          </p>
        )}

        <div className="flex items-center gap-2.5">
          {icon && (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-gradient-to-br from-primary/15 to-primary/5 text-primary",
                "ring-1 ring-primary/15 ring-inset",
                "shadow-sm shadow-primary/5",
              )}
            >
              {icon}
            </span>
          )}

          <h1
            className={cn(
              "truncate text-2xl font-black tracking-tight text-primary sm:text-3xl",
              // animated underline accent that grows on mount
              "relative inline-block after:absolute after:-bottom-1 after:right-0",
              "after:h-0.5 after:w-10 after:rounded-full",
              "after:bg-gradient-to-l after:from-primary after:to-primary/30",
              "after:transition-[width] after:duration-300 motion-reduce:after:transition-none",
              "hover:after:w-16",
            )}
          >
            {title}
          </h1>
        </div>

        {description && (
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Action area */}
      {action && (
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          {action}
        </div>
      )}
    </header>
  );
}