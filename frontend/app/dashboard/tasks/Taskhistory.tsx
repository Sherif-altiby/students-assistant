"use client";

import { useState } from "react";
import { CalendarDays, History, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useTaskHistory } from "@/hooks/Usetasks";
import type { TaskFrequency } from "@/types/task";

const FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  TODAY: "اليوم فقط",
  EVERY_DAY: "كل الأيام",
};

function formatDayLabel(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function TaskHistory() {
  const [page, setPage] = useState(1);
  const { days, pagination, isLoading, isFetching, isError } = useTaskHistory(page, 10);

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <History className="h-5 w-5 text-primary" />
        <CardTitle className="text-sm font-semibold">سجل الإنجاز</CardTitle>
        {isFetching && !isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-(--radius-md) border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            تعذر تحميل سجل الإنجاز
          </p>
        ) : days.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا يوجد سجل إنجاز بعد
          </p>
        ) : (
          <Accordion
            defaultValue={[days[0]?.date]}
            className="space-y-3"
          >
            {days.map((day) => (
              <AccordionItem
                key={day.date}
                value={day.date}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <AccordionTrigger dir="rtl"  className="gap-3 px-4 py-3 hover:no-underline [&>svg]:shrink-0">
                  <div className="flex flex-1 items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {formatDayLabel(day.date)}
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-primary/10 text-primary hover:bg-primary/10"
                    >
                      {day.totalTasks} {day.totalTasks === 1 ? "مهمة" : "مهام"}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent dir="rtl" className="pb-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableHead className="text-right text-xs font-medium">
                          العنوان
                        </TableHead>
                        {/* <TableHead className="text-right text-xs font-medium">
                          التكرار
                        </TableHead> */}
                        <TableHead className="text-right text-xs font-medium">
                          وقت الإنجاز
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {day.tasks.map((task) => (
                        <TableRow key={task.id + task.completedAt} className="hover:bg-muted/10">
                          <TableCell className="py-3 text-sm font-medium text-foreground">
                            {task.completedTitle}
                          </TableCell>
                          
                          <TableCell className="py-3 text-sm text-muted-foreground">
                            {formatTime(task.completedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Pagination className="justify-between">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => pagination.hasPreviousPage && setPage((p) => p - 1)}
                  className={
                    !pagination.hasPreviousPage
                      ? "pointer-events-none opacity-40"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === pagination.page}
                      onClick={() => setPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => pagination.hasNextPage && setPage((p) => p + 1)}
                  className={
                    !pagination.hasNextPage
                      ? "pointer-events-none opacity-40"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
}