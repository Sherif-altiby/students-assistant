import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export default function PageHeader({ title, description, icon }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-7 sm:px-8 sm:py-8">

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
          {icon}
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}