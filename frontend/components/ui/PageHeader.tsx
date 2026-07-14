import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode; // لإضافة أزرار أو عناصر تفاعلية يسار العنوان
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-neutral-100 pb-6 sm:flex-row-reverse sm:items-center sm:justify-between",
        className
      )}
    >
      {/* النصوص والوصف */}
      <div className="space-y-1.5 text-right flex-1 min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl transition-all duration-200">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* زر تفاعلي اختياري على الجانب الآخر */}
      {action && (
        <div className="flex items-center justify-start sm:shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}