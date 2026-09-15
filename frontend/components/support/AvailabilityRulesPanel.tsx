"use client";

import { useAvailabilityRules } from "@/hooks/useSupport";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CalendarClock, Pencil, Plus, Trash2, Clock } from "lucide-react";
import type { AvailabilityRule, DayOfWeek } from "@/lib/support";
import { RuleFormDialog } from "./RuleFormDialog";

const DAY_LABELS: Record<DayOfWeek, string> = {
  SATURDAY: "السبت",
  SUNDAY: "الأحد",
  MONDAY: "الإثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
};

const TYPE_LABELS: Record<AvailabilityRule["type"], string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  CUSTOM: "تاريخ محدد",
};

function formatRuleSchedule(rule: AvailabilityRule): string {
  if (rule.type === "DAILY") {
    return `كل يوم، ${rule.startTime} - ${rule.endTime}`;
  }
  if (rule.type === "WEEKLY" && rule.dayOfWeek) {
    return `كل ${DAY_LABELS[rule.dayOfWeek]}، ${rule.startTime} - ${rule.endTime}`;
  }
  if (rule.type === "CUSTOM" && rule.customDate) {
    const date = new Date(rule.customDate).toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `${date}، ${rule.startTime} - ${rule.endTime}`;
  }
  return `${rule.startTime} - ${rule.endTime}`;
}

export function AvailabilityRulesPanel() {
  const {
    rules,
    isLoading,
    error,
    createRule,
    isCreating,
    updateRule,
    isUpdating,
    deleteRule,
    isDeleting,
  } = useAvailabilityRules();

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                إجمالي المواعيد
              </p>
              <p className="text-2xl font-bold tracking-tight">{rules.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                مواعيد نشطة
              </p>
              <p className="text-2xl font-bold tracking-tight">{activeCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                مواعيد متوقفة
              </p>
              <p className="text-2xl font-bold tracking-tight">
                {rules.length - activeCount}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 bg-muted/20">
          <div>
            <CardTitle className="text-lg">مواعيد الإتاحة</CardTitle>
            <CardDescription>
              حدد الأوقات التي تكون فيها متاحًا لاستقبال الحجوزات
            </CardDescription>
          </div>
          <RuleFormDialog
            trigger={
              <Button size="sm" className="shadow-sm">
                <Plus className="me-2 h-4 w-4" />
                إضافة موعد
              </Button>
            }
            isSubmitting={isCreating}
            onSubmit={(payload) => createRule(payload)}
          />
        </CardHeader>

        <CardContent className="space-y-3 p-4 md:p-6">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && rules.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
                <CalendarClock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  لا توجد مواعيد إتاحة بعد
                </p>
                <p className="text-xs text-muted-foreground">
                  أضف موعدك الأول لتبدأ باستقبال الحجوزات
                </p>
              </div>
            </div>
          )}

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={rule.isActive ? "default" : "secondary"}
                  className="rounded-md px-2.5 py-1 text-xs font-medium"
                >
                  {TYPE_LABELS[rule.type]}
                </Badge>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {formatRuleSchedule(rule)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rule.isActive ? "نشط" : "متوقف"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <RuleFormDialog
                  rule={rule}
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="تعديل الموعد"
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                  isSubmitting={isUpdating}
                  onSubmit={(payload) => updateRule({ id: rule.id, payload })}
                />

                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="حذف الموعد"
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف موعد الإتاحة؟</AlertDialogTitle>
                      <AlertDialogDescription className="text-right">
                        لن يتمكن الطلاب من الحجز في هذا الموعد بعد الحذف، ولا
                        يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={isDeleting}
                        onClick={() => deleteRule(rule.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}