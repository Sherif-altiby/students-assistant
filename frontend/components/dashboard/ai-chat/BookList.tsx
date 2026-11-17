"use client";

import Link from "next/link";
import { BookOpen, FileText, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import type { BookStatus } from "@/types/book";

const STATUS_LABEL: Record<BookStatus, string> = {
  READY: "جاهز",
  PROCESSING: "قيد التجهيز",
  UPLOADING: "لم يكتمل الرفع",
  FAILED: "فشل التجهيز",
};

const STATUS_STYLE: Record<BookStatus, string> = {
  READY: "bg-primary/10 text-primary",
  PROCESSING: "bg-muted text-muted-foreground",
  UPLOADING: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BookList() {
  const { books, isLoading, isError, deleteBook, deletingId, deleteError } =
    useBooks();

  function handleDelete(id: string, title: string) {
    if (window.confirm(`هتمسح كتاب "${title}" ومحادثاته نهائيًا. متأكد؟`)) {
      deleteBook(id);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-foreground">كتبي</h2>

      {isError && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          تعذر تحميل قائمة الكتب
        </p>
      )}

      {deleteError && (
        <p role="alert" className="text-sm text-destructive">
          تعذر حذف الكتاب
        </p>
      )}

      {isLoading ? (
        Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-2xl border border-border bg-muted/40"
          />
        ))
      ) : books.length === 0 && !isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            لسه ماعندكش كتب، ارفع أول كتاب من النموذج أعلاه
          </p>
        </div>
      ) : (
        books.map((book) => (
          <div
            key={book.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-sm font-bold text-foreground">
                  {book.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[
                    book.pageCount ? `${book.pageCount} صفحة` : null,
                    formatDate(book.createdAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[book.status] ?? STATUS_STYLE.PROCESSING}`}
              >
                {book.status === "PROCESSING" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {STATUS_LABEL[book.status] ?? book.status}
                {book.status === "PROCESSING" && book.progress > 0
                  ? ` ${book.progress}%`
                  : ""}
              </span>

              {book.status === "READY" && (
                <Link
                  href={`/dashboard/ai-chat/${book.id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  محادثة
                </Link>
              )}

              <button
                type="button"
                onClick={() => handleDelete(book.id, book.title)}
                disabled={deletingId === book.id}
                aria-label={`حذف ${book.title}`}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {deletingId === book.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}