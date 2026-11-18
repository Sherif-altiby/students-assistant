import Link from "next/link";
import { AlertCircle, SearchX } from "lucide-react";
import type { QuizError } from "@/lib/quiz-errors";

interface QuizErrorStateProps {
  error: QuizError | null;
  onRetry: () => void;
  backHref: string;
}

export function QuizErrorState({ error, onRetry, backHref }: QuizErrorStateProps) {
  const notFound = !error || error.kind === "not_found";
  const Icon = notFound ? SearchX : AlertCircle;

  return (
    <div
      dir="rtl"
      role={notFound ? undefined : "alert"}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {error?.message ?? "العنصر المطلوب غير موجود"}
      </p>
      <div className="flex gap-2">
        {!notFound && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            إعادة المحاولة
          </button>
        )}
        <Link
          href={backHref}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          رجوع
        </Link>
      </div>
    </div>
  );
}