"use client";

import MainButton from "@/components/ui/MainButton";

export function AdminPagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="صفحات النتائج"
      className="flex items-center justify-between gap-3 border-t border-border pt-4"
    >
      <p className="text-sm text-muted-foreground">
        صفحة {page} من {totalPages} · {total} نتيجة
      </p>
      <div className="flex gap-2">
        <MainButton
          title="السابقة"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <MainButton
          title="التالية"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}
