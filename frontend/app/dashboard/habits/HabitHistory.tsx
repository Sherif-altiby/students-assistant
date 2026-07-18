"use client";

import { CalendarDays, History, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { Habit, HabitHistoryDay } from "@/types/habit"; // adjust path

interface HabitHistoryProps {
  habits: Habit[];
  history: HabitHistoryDay[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
}

function formatDayLabel(dateOnly: string) {
  // dateOnly is "YYYY-MM-DD"; parse as local date, not UTC, to avoid
  // off-by-one-day shifts from `new Date("YYYY-MM-DD")` treating it as UTC midnight.
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function HabitHistory({
  habits,
  history,
  page,
  totalPages,
  onPageChange,
  isLoading = false,
  isFetching = false,
  isError = false,
}: HabitHistoryProps) {
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
              <div
                key={i}
                className="h-12 animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-(--radius-md) border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            تعذر تحميل سجل الإنجاز
          </p>
        ) : history.length === 0 || habits.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            لا يوجد سجل إنجاز بعد
          </p>
        ) : (
          <Accordion
            dir="rtl"
            defaultValue={[history[0]?.date]}
            className="space-y-3"
          >
            {history.map((day) => {
              const completedSet = new Set(day.completedHabitIds);
              const completedCount = day.completedHabitIds.length;

              return (
                <AccordionItem
                  key={day.date}
                  value={day.date}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <AccordionTrigger className="gap-3 px-4 py-3 hover:no-underline [&>svg]:shrink-0">
                    <div className="flex flex-1 items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {formatDayLabel(day.date)}
                      </span>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-primary/10 text-primary hover:bg-primary/10"
                      >
                        {completedCount} من {habits.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pb-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableHead className="text-right text-xs font-medium">
                            العادة
                          </TableHead>
                          <TableHead className="text-right text-xs font-medium">
                            الحالة
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {habits.map((habit) => {
                          const completed = completedSet.has(habit.id);
                          return (
                            <TableRow
                              key={habit.id}
                              className="hover:bg-muted/10"
                            >
                              <TableCell className="py-3 text-sm font-medium text-foreground">
                                {habit.title}
                              </TableCell>
                              <TableCell className="py-3 text-sm">
                                <Badge
                                  variant={completed ? "secondary" : "outline"}
                                  className={
                                    completed
                                      ? "bg-primary/10 text-primary hover:bg-primary/10"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {completed ? "منجزة" : "غير منجزة"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {totalPages > 1 && (
          <Pagination className="justify-between">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && onPageChange(page - 1)}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-40"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pageNum === page}
                      onClick={() => onPageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && onPageChange(page + 1)}
                  className={
                    page === totalPages
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
