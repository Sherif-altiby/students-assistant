"use client";

import * as React from "react";
import {
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  title?: React.ReactNode;
  className?: string;
}

function getPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  title?: React.ReactNode;
  className?: string;

  /** Server-driven pagination: `data` is already the current page. */
  manualPagination?: boolean;
  /** Current page (1-indexed) — required when manualPagination is true. */
  page?: number;
  /** Total page count — required when manualPagination is true. */
  pageCount?: number;
  /** Called when the user requests a page change (manual mode only). */
  onPageChange?: (page: number) => void;
  /** Shows a subtle overlay/opacity while a new page is loading. */
  isFetching?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  pageSize = 6,
  searchable = false,
  searchPlaceholder = "بحث...",
  searchFn,
  emptyMessage = "لا توجد بيانات",
  noResultsMessage = "لا توجد نتائج مطابقة",
  title,
  className,
  manualPagination = false,
  page: controlledPage,
  pageCount: controlledPageCount,
  onPageChange,
  isFetching = false,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [internalPage, setInternalPage] = React.useState(1);

  const page = manualPagination ? (controlledPage ?? 1) : internalPage;

  const defaultSearchFn = React.useCallback(
    (row: T, q: string) => {
      const haystack = columns
        .map((col) => {
          const value = col.cell(row);
          return typeof value === "string" || typeof value === "number"
            ? String(value)
            : "";
        })
        .join(" ")
        .toLowerCase();
      return haystack.includes(q.toLowerCase());
    },
    [columns],
  );

  // In manual mode, `data` is already the page from the server — search
  // only filters within the current page unless you wire it to the API.
  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return data;
    const matcher = searchFn ?? defaultSearchFn;
    return data.filter((row) => matcher(row, query.trim()));
  }, [data, query, searchable, searchFn, defaultSearchFn]);

  const totalPages = manualPagination
    ? Math.max(1, controlledPageCount ?? 1)
    : Math.max(1, Math.ceil(filtered.length / pageSize));

  React.useEffect(() => {
    if (!manualPagination) setInternalPage(1);
  }, [query, manualPagination]);

  React.useEffect(() => {
    if (!manualPagination && internalPage > totalPages) {
      setInternalPage(totalPages);
    }
  }, [manualPagination, internalPage, totalPages]);

  const paginated = manualPagination
    ? filtered
    : filtered.slice((page - 1) * pageSize, page * pageSize);

  function goToPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (manualPagination) {
      onPageChange?.(clamped);
    } else {
      setInternalPage(clamped);
    }
  }

  return (
    <div className={cn(/* ...unchanged wrapper classes... */ className)}>
      {/* ...unchanged header/search block... */}

      <div
        className={cn(
          "overflow-x-auto",
          isFetching && "opacity-60 transition-opacity",
        )}
      >
        <Table>
          {/* ...unchanged TableHeader... */}
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center text-sm text-[#71767b]"
                >
                  {/* ...unchanged empty state... */}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, index) => (
                <TableRow key={getRowId(row)} /* ...unchanged... */>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn("py-3.5 text-sm", col.cellClassName)}
                    >
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="border-t border-[#eff3f4] bg-[#f7f9f9]/30 px-6 py-3.5 rounded-b-2xl">
          <Pagination>
            <PaginationContent className="gap-1">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(page - 1);
                  }}
                  className={cn(
                    "rounded-full border border-[#eff3f4] text-[#0f1419] hover:bg-[#eff3f4] hover:text-[#0f1419]",
                    page === 1 && "pointer-events-none opacity-30",
                  )}
                />
              </PaginationItem>

              {getPageList(page, totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis className="text-[#71767b]" />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(p);
                      }}
                      className={cn(
                        "rounded-full text-sm font-medium transition-all",
                        p === page
                          ? "bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
                          : "text-[#0f1419] hover:bg-[#eff3f4]",
                      )}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(page + 1);
                  }}
                  className={cn(
                    "rounded-full border border-[#eff3f4] text-[#0f1419] hover:bg-[#eff3f4] hover:text-[#0f1419]",
                    page === totalPages && "pointer-events-none opacity-30",
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
