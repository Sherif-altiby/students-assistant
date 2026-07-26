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
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>مواعيد الإتاحة</CardTitle>
          <CardDescription>حدد الأوقات التي تكون فيها متاحًا لاستقبال الحجوزات</CardDescription>
        </div>
        <RuleFormDialog
          trigger={
            <Button size="sm">
              <Plus className="me-2 h-4 w-4" />
              إضافة موعد
            </Button>
          }
          isSubmitting={isCreating}
          onSubmit={(payload) => createRule(payload)}
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && rules.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-muted-foreground">
            <CalendarClock className="h-8 w-8" />
            <p className="text-sm">لا توجد مواعيد إتاحة بعد</p>
          </div>
        )}

        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex items-center gap-3">
              <Badge variant={rule.isActive ? "default" : "secondary"}>
                {TYPE_LABELS[rule.type]}
              </Badge>
              <span className="text-sm">{formatRuleSchedule(rule)}</span>
            </div>

            <div className="flex items-center gap-1">
              <RuleFormDialog
                rule={rule}
                trigger={
                  <Button size="icon" variant="ghost" aria-label="تعديل الموعد">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
                isSubmitting={isUpdating}
                onSubmit={(payload) => updateRule({ id: rule.id, payload })}
              />

              <AlertDialog>
                <AlertDialogTrigger  >
                  <Button size="icon" variant="ghost" aria-label="حذف الموعد">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف موعد الإتاحة؟</AlertDialogTitle>
                    <AlertDialogDescription className={'text-right'} >
                      لن يتمكن المرضى من الحجز في هذا الموعد بعد الحذف، ولا يمكن التراجع عن هذا
                      الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction disabled={isDeleting} onClick={() => deleteRule(rule.id)}>
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
  );
}