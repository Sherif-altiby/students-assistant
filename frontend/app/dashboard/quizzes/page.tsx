"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import { QuizCard } from "@/components/dashboard/quiz/QuizCard";
import { useBooks } from "@/hooks/useBooks";
import { useQuizzes } from "@/hooks/useQuizzes";
import { QUIZ_LIST_PAGE_SIZE } from "@/constants/index";

function QuizzesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId") ?? undefined;

  const [page, setPage] = useState(1);
  const { books } = useBooks();
  const { quizzes, pagination, isLoading, isFetching, error, refetch } =
    useQuizzes({ page, limit: QUIZ_LIST_PAGE_SIZE, bookId });

  const bookOptions = [
    { value: "all", label: "كل الكتب" },
    ...books.map((b) => ({ value: b.id, label: b.title })),
  ];

  function handleBookChange(value: string) {
    setPage(1);
    router.replace(
      value === "all"
        ? "/dashboard/quizzes"
        : `/dashboard/quizzes?bookId=${value}`,
    );
  }

  return (
    <div className="mx-auto w-full space-y-6 p-4">
      <PageHeader
        title="الكويزات"
        description="كل الكويزات اللي عملتها، افتح أي واحد لتحله من جديد أو تراجع نتائجك السابقة."
        icon={<ClipboardList className="h-5 w-5" />}
      />

      <FormCustomSelect
        className="sm:w-72"
        label="الكتاب"
        id="quiz-book-filter"
        value={bookId ?? "all"}
        onChange={handleBookChange}
        options={bookOptions}
      />

      <div className="space-y-2.5" aria-live="polite" aria-busy={isFetching}>
        {error ? (
          <div
            role="alert"
            className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-center"
          >
            <p className="text-sm text-destructive">{error.message}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[92px] animate-pulse rounded-2xl border border-border bg-muted/40"
            />
          ))
        ) : quizzes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
              <ClipboardList
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-medium text-foreground">
              لسه ماعملتش أي كويز
            </p>
            <p className="text-xs text-muted-foreground">
              افتح أحد كتبك وهتلاقي مربع إنشاء الكويز تحت المحادثة
            </p>
            <Link
              href="/dashboard/ai-chat"
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              الذهاب إلى كتبي
            </Link>
          </div>
        ) : (
          quizzes.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} />)
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="التنقل بين الصفحات"
          className="flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled={!pagination.hasPrevPage || isFetching}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            السابق
          </button>
          <span className="text-sm text-muted-foreground">
            صفحة {pagination.currentPage} من {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage || isFetching}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            التالي
          </button>
        </nav>
      )}
    </div>
  );
}

// useSearchParams needs a Suspense boundary
export default function QuizzesPage() {
  return (
    <Suspense fallback={null}>
      <QuizzesContent />
    </Suspense>
  );
}