"use client";

import { useEffect, useState } from "react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationPages,
} from "@/components/ui/pagination";
import { useTaskHistory } from "@/hooks/Usetasks";

const nf = new Intl.NumberFormat("ar-EG");

const dayNumberFmt = new Intl.DateTimeFormat("ar-EG", { day: "numeric" });
const monthShortFmt = new Intl.DateTimeFormat("ar-EG", { month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("ar-EG", { weekday: "long" });
const fullDateFmt = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("ar-EG", {
  hour: "2-digit",
  minute: "2-digit",
});

/** Arabic count phrase: 1 / 2 use the singular and dual forms, 3-10 plural, 11+ singular accusative. */
function countLabel(
  n: number,
  f: { one: string; two: string; few: string; many: string },
) {
  if (n === 1) return f.one;
  if (n === 2) return f.two;
  return `${nf.format(n)} ${n >= 3 && n <= 10 ? f.few : f.many}`;
}

function relativeDay(iso: string): "اليوم" | "أمس" | null {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(iso))) / 86_400_000,
  );
  if (diff === 0) return "اليوم";
  if (diff === 1) return "أمس";
  return null;
}

export function TaskHistory() {
  const [page, setPage] = useState(1);
  const [expandedDates, setExpandedDates] = useState<string[]>([]);
  const { days, pagination, isLoading, isFetching, isError } = useTaskHistory(
    page,
    10,
  );

  useEffect(() => {
    setExpandedDates((current) => {
      const availableDates = days.map((day) => day.date);
      const retainedDates = current.filter((date) =>
        availableDates.includes(date),
      );
      const nextDates =
        retainedDates.length > 0 ? retainedDates : availableDates.slice(0, 1);

      return current.length === nextDates.length &&
        current.every((date, index) => date === nextDates[index])
        ? current
        : nextDates;
    });
  }, [days]);

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <History className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold leading-none">
              سجل الإنجاز
            </CardTitle>
            <p className="mt-1.5 text-xs text-muted-foreground">
              المهام التي أنجزتها في كل يوم
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {days.length > 0 && (
            <Badge
              variant="secondary"
              className="rounded-full bg-muted px-2.5 text-xs font-medium text-muted-foreground"
            >
              {countLabel(days.length, {
                one: "يوم واحد",
                two: "يومان",
                few: "أيام",
                many: "يومًا",
              })}
            </Badge>
          )}
          {isFetching && !isLoading && (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-label="جارٍ التحديث"
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse rounded-xl bg-muted/40"
              />
            ))}
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 py-10 text-center"
          >
            <p className="text-sm font-medium text-destructive">
              تعذر تحميل سجل الإنجاز
            </p>
            <p className="text-xs text-muted-foreground">
              تحقق من اتصالك ثم أعد تحميل الصفحة
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
                أكمل مهمة وسيظهر إنجازك هنا
              </p>
            </div>
          </div>
        ) : (
          <Accordion
            value={expandedDates}
            onValueChange={(value) => setExpandedDates(value)}
            className="space-y-3"
          >
            {days.map((day) => {
              const relative = relativeDay(day.date);
              const date = new Date(day.date);

              return (
                <AccordionItem
                  key={day.date}
                  value={day.date}
                  className="overflow-hidden rounded-xl border border-border/60 bg-card motion-safe:transition-colors data-[state=open]:border-primary/30 data-[state=open]:bg-primary/[0.02]"
                >
                  <AccordionTrigger
                    dir="rtl"
                    className="gap-3 px-4 py-3 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:shrink-0 [&>svg]:text-muted-foreground"
                  >
                    <div className="flex flex-1 items-center gap-3.5">
                      {/* Calendar tile: the date itself is the visual anchor */}
                      <div
                        aria-hidden
                        className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-primary/15 bg-primary/[0.07] leading-none"
                      >
                        <span className="text-lg font-semibold tabular-nums text-primary">
                          {dayNumberFmt.format(date)}
                        </span>
                        <span className="mt-1 text-[10px] font-medium text-primary/70">
                          {monthShortFmt.format(date)}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col items-start gap-1 text-right">
                        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          {weekdayFmt.format(date)}
                          {relative && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                              {relative}
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {fullDateFmt.format(date)}
                        </span>
                      </div>

                      <Badge
                        variant="secondary"
                        className="rounded-full bg-primary/10 px-2.5 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        {countLabel(day.totalTasks, {
                          one: "مهمة واحدة",
                          two: "مهمتان",
                          few: "مهام",
                          many: "مهمة",
                        })}
                      </Badge>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent dir="rtl" className="pb-0">
                    <div className="border-t border-border/60 px-5 py-4">
                      {/* Timeline: the order of completion is real information here */}
                      <ol className="ms-[9px] border-s border-border/70">
                        {day.tasks.map((task) => (
                          <li
                            key={task.id + task.completedAt}
                            className="relative flex items-center justify-between gap-3 py-2.5 ps-6"
                          >
                            <CheckCircle2
                              aria-hidden
                              className="absolute -start-[9px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-card text-emerald-500"
                            />
                            <span className="min-w-0 break-words text-sm font-medium text-foreground">
                              {task.completedTitle}
                            </span>
                            <time
                              dateTime={task.completedAt}
                              className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium tabular-nums text-muted-foreground"
                            >
                              {timeFmt.format(new Date(task.completedAt))}
                            </time>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">
              صفحة {nf.format(pagination.page)} من{" "}
              {nf.format(pagination.totalPages)}
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

                {getPaginationPages(pagination.page, pagination.totalPages).map(
                  (pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === pagination.page}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {typeof pageNum === "number"
                          ? nf.format(pageNum)
                          : pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

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