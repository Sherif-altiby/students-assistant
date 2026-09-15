"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDoctorSlots } from "@/hooks/useSupport";
import type { Slot } from "@/lib/support";
import {
  CalendarX2,
  Clock,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTimeRange(slot: Slot): string {
  const start = new Date(slot.startTime).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(slot.endTime).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} - ${end}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isTomorrow(iso: string): boolean {
  const d = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

function getDayBadge(
  iso: string,
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} | null {
  if (isToday(iso)) return { label: "اليوم", variant: "destructive" };
  if (isTomorrow(iso)) return { label: "غدًا", variant: "default" };
  return null;
}

function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = slot.startTime.slice(0, 10);
    acc[key] = acc[key] ? [...acc[key], slot] : [slot];
    return acc;
  }, {});
}

export function SlotPicker({ doctorId }: { doctorId: string }) {
  const { slots, isLoading, isError, bookSlot, isBooking } =
    useDoctorSlots(doctorId);

  const openSlots = slots.filter((slot) => slot.status === "OPEN");
  const grouped = groupByDay(openSlots);
  const days = Object.keys(grouped).sort();

  return (
    <Card className="overflow-hidden border-border/60 bg-background shadow-sm">
      <CardHeader className="border-b border-border/50 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                المواعيد المتاحة
              </CardTitle>
              <CardDescription className="mt-1 text-sm leading-relaxed">
                اختر الموعد المناسب وقدّم طلب الحجز بكل سهولة
              </CardDescription>
            </div>
          </div>

          {!isLoading && !isError && openSlots.length > 0 && (
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15"
            >
              <Sparkles className="h-3 w-3" />
              {openSlots.length} موعد متاح
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <div className="rounded-full bg-destructive/10 p-1.5">
              <CalendarX2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">تعذر تحميل المواعيد</p>
              <p className="mt-0.5 text-destructive/80">
                يرجى المحاولة مرة أخرى لاحقًا.
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-8">
            {[4, 2].map((count, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-px flex-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-px flex-1" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: count }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && openSlots.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/15 bg-muted/20 px-6 py-20 text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-muted-foreground/10" />
              <div className="relative rounded-full bg-muted/60 p-5 ring-1 ring-border">
                <CalendarX2 className="h-8 w-8 text-muted-foreground/70" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground/80">
                لا توجد مواعيد متاحة حاليًا
              </p>
              <p className="text-sm text-muted-foreground">
                يرجى التحقق مرة أخرى لاحقًا، أو التواصل مع الطبيب مباشرة
              </p>
            </div>
          </div>
        )}

        {/* Days & Slots */}
        {days.map((day, index) => {
          const dayBadge = getDayBadge(grouped[day][0].startTime);
          return (
            <div
              key={day}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-500",
                index !== 0 && "mt-10",
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Day Header */}
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <div className="flex shrink-0 items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground/80">
                    {formatDayLabel(grouped[day][0].startTime)}
                  </h3>
                  {dayBadge && (
                    <Badge
                      variant={dayBadge.variant}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    >
                      {dayBadge.label}
                    </Badge>
                  )}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Slots Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {grouped[day].map((slot, slotIdx) => (
                  <Card
                    key={slot.id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-border/60 bg-card transition-all duration-300",
                      "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
                      "animate-in fade-in zoom-in-95 duration-300",
                    )}
                    style={{ animationDelay: `${slotIdx * 40}ms` }}
                  >
                    {/* Left accent bar */}
                    <div className="absolute inset-y-0 right-0 w-1 bg-primary/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <CardContent className="relative p-4">
                      <div className="flex h-full flex-col">
                        {/* Time */}
                        <div className="mb-3 flex items-center gap-2.5">
                          <div className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/10 transition-colors group-hover:bg-primary/15">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-bold tracking-tight text-foreground">
                            {formatTimeRange(slot)}
                          </span>
                        </div>

                        {/* Date */}
                        <div className="mb-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarX2 className="h-3.5 w-3.5" />
                          <span>{formatDate(slot.startTime)}</span>
                        </div>

                        {/* Status */}
                        <div className="mb-4 flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                          </span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-500">
                            متاح للحجز
                          </span>
                        </div>

                        {/* Book Button */}
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={isBooking}
                              className={cn(
                                "group/btn mt-auto w-full gap-2 rounded-lg font-semibold",
                                "transition-all duration-300 hover:shadow-md hover:shadow-primary/20",
                                "active:scale-[0.98]",
                              )}
                            >
                              <span>طلب دعم نفسي</span>
                              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:-translate-x-0.5" />
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent className="max-w-md overflow-hidden p-0">
                            <div className="p-6">
                              <AlertDialogHeader>
                                <div className="mb-3 flex items-center gap-3">
                                  <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/10">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                  </div>
                                  <AlertDialogTitle className="text-xl font-bold">
                                    تأكيد طلب الدعم النفسي
                                  </AlertDialogTitle>
                                </div>

                                <AlertDialogDescription>
                                  <div className="space-y-4 text-right">
                                    {/* Summary card */}
                                    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                                      <div className="space-y-2.5">
                                        <div className="flex items-center gap-2.5">
                                          <CalendarDays className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-semibold text-foreground">
                                            {formatDayLabel(slot.startTime)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                          <Clock className="h-4 w-4 text-primary" />
                                          <span className="text-sm font-semibold text-foreground">
                                            {formatTimeRange(slot)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                      <p className="text-xs leading-relaxed">
                                        سينتظر الطلب موافقة الطبيب. سيتم إشعارك
                                        عند تأكيد الحجز.
                                      </p>
                                    </div>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter className="mt-6 flex-row-reverse gap-2 sm:flex-row-reverse">
                                <AlertDialogAction
                                  disabled={isBooking}
                                  onClick={() => bookSlot(slot.id)}
                                  className="min-w-[130px] gap-2 font-semibold"
                                >
                                  {isBooking ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      جاري الطلب...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      تأكيد الطلب
                                    </>
                                  )}
                                </AlertDialogAction>
                                <AlertDialogCancel className="mt-0 font-medium">
                                  إلغاء
                                </AlertDialogCancel>
                              </AlertDialogFooter>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
