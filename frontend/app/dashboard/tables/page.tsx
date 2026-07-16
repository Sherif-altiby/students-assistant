"use client";

import { CalendarDays } from "lucide-react";
import PageHeader from "@/components/PageHeader";

import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useStudyTables } from "@/hooks/useStudyTables";
import { cn } from "@/lib/utils";
import { CreateStudyTableDialog } from "./CreateStudyTableDialog";
import { StudyTableCard } from "./StudyTableCard";

export default function StudyTablesPage() {
  const { tables, pagination, isLoading, page, setPage, createTable, isCreating, deleteTable } =
    useStudyTables();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="جداول المذاكرة"
          description="نظّم وقتك وتابع تقدمك في كل درس"
          icon={<CalendarDays className="h-7 w-7 text-primary" />}
        />
        <CreateStudyTableDialog onCreate={createTable} isCreating={isCreating} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card className="text-center text-sm text-muted-foreground">
          لا توجد جداول مذاكرة بعد، ابدأ بإنشاء جدول جديد
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <StudyTableCard key={table.id} table={table} onDelete={deleteTable} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                className={cn(page === 1 && "pointer-events-none opacity-40")}
              />
            </PaginationItem>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(pagination.totalPages, p + 1));
                }}
                className={cn(page === pagination.totalPages && "pointer-events-none opacity-40")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}