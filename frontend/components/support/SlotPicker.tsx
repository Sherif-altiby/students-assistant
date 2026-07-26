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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorSlots } from "@/hooks/useSupport";
import type { Slot } from "@/lib/support";
import { CalendarX2, Clock, User, CheckCircle2 } from "lucide-react";

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

function groupByDay(slots: Slot[]): Record<string, Slot[]> {
  return slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const key = slot.startTime.slice(0, 10);
    acc[key] = acc[key] ? [...acc[key], slot] : [slot];
    return acc;
  }, {});
}

export function SlotPicker({ doctorId }: { doctorId: string }) {
  const { slots, isLoading, isError, bookSlot, isBooking } = useDoctorSlots(doctorId);

  const openSlots = slots.filter((slot) => slot.status === "OPEN");
  const grouped = groupByDay(openSlots);
  const days = Object.keys(grouped).sort();

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              المواعيد المتاحة
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm">
              اختر الموعد المناسب وقدّم طلب الحجز
            </CardDescription>
          </div>
          {!isLoading && openSlots.length > 0 && (
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {openSlots.length} موعد
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            تعذر تحميل المواعيد المتاحة. يرجى المحاولة مرة أخرى.
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        )}

        {!isLoading && openSlots.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 py-16 text-center">
            <div className="rounded-full bg-muted/50 p-4">
              <CalendarX2 className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                لا توجد مواعيد متاحة حاليًا
              </p>
              <p className="text-xs text-muted-foreground/70">
                يرجى التحقق مرة أخرى لاحقًا
              </p>
            </div>
          </div>
        )}

        {days.map((day, index) => (
          <div key={day} className={index !== 0 ? "mt-8" : ""}>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border/50" />
              <h3 className="shrink-0 text-sm font-semibold text-muted-foreground">
                {formatDayLabel(grouped[day][0].startTime)}
              </h3>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3  lg:grid-cols-4  xl:grid-cols-5">
              {grouped[day].map((slot) => (
                <Card
                  key={slot.id}
                  className="group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full">
                      {/* Time */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">
                          {formatTimeRange(slot)}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <CalendarX2 className="h-3.5 w-3.5" />
                        <span>{formatDate(slot.startTime)}</span>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>متاح</span>
                      </div>

                      {/* Book Button */}
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isBooking}
                            className="w-full mt-auto transition-all group-hover:shadow-md"
                          >
                           طلب دعم نفسي
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl">
                             طلب دعم نفسي
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2 text-right">
                              <p>
                                سيتم إرسال طلب حجز لموعد{" "}
                                <span className="font-semibold text-foreground">
                                  {formatDayLabel(slot.startTime)}
                                </span>
                                ، الساعة{" "}
                                <span className="font-semibold text-foreground">
                                  {formatTimeRange(slot)}
                                </span>
                                .
                              </p>
                              <p className="text-sm text-muted-foreground">
                                سينتظر الطلب موافقة الطبيب.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2 ">
                            <AlertDialogCancel className="mt-0">
                              إلغاء
                            </AlertDialogCancel>
                            <AlertDialogAction
                              disabled={isBooking}
                              onClick={() => bookSlot(slot.id)}
                              className="min-w-[100px]"
                            >
                              {isBooking ? "جاري الطلب..." : " طلب دعم نفسي  "}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}