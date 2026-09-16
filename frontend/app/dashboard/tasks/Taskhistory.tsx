"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, History, Loader2 } from "lucide-react";
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
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <History className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold leading-none">
              سجل الإنجاز
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              تتبع مهامك المكتملة يومياً
            </p>
          </div>
        </div>
        {isFetching && !isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">
              تعذر تحميل سجل الإنجاز
            </p>
            <p className="text-xs text-muted-foreground">
              يرجى المحاولة مرة أخرى لاحقاً
            </p>
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                لا يوجد سجل إنجاز بعد
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ابدأ بإكمال مهامك لتظهر هنا
              </p>
            </div>
          </div>
        ) : (
          <Accordion
             defaultValue={[days[0]?.date]}
            className="space-y-3"
          >
            {days.map((day, index) => (
              <AccordionItem
                key={day.date}
                value={day.date}
                className="overflow-hidden rounded-xl border border-border/60 bg-card transition-colors data-[state=open]:border-primary/30 data-[state=open]:bg-primary/[0.02]"
              >
                <AccordionTrigger
                  dir="rtl"
                  className="gap-3 px-4 py-3.5 hover:no-underline [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                >
                  <div className="flex flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-1 flex-col items-start gap-1 text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {formatDayLabel(day.date)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {index === 0 ? "اليوم" : "سابقاً"}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
                    >
                      {day.totalTasks}{" "}
                      {day.totalTasks === 1 ? "مهمة" : "مهام"}
                    </Badge>
                  </div>
                </AccordionTrigger>

                <AccordionContent dir="rtl" className="pb-0">
                  <div className="border-t border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-right text-xs font-medium text-muted-foreground">
                            العنوان
                          </TableHead>
                          <TableHead className="w-[100px] text-right text-xs font-medium text-muted-foreground">
                            وقت الإنجاز
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {day.tasks.map((task) => (
                          <TableRow
                            key={task.id + task.completedAt}
                            className="group hover:bg-muted/20"
                          >
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span className="text-sm font-medium text-foreground">
                                  {task.completedTitle}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                                {formatTime(task.completedAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              صفحة {pagination.page} من {pagination.totalPages}
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      pagination.hasPreviousPage && setPage((p) => p - 1)
                    }
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
                    onClick={() =>
                      pagination.hasNextPage && setPage((p) => p + 1)
                    }
                    className={
                      !pagination.hasNextPage
                        ? "pointer-events-none opacity-40"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}