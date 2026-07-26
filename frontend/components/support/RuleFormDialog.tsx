"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type {
  AvailabilityRule,
  AvailabilityRuleType,
  CreateAvailabilityRulePayload,
  DayOfWeek,
} from "@/lib/support";

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "SATURDAY", label: "السبت" },
  { value: "SUNDAY", label: "الأحد" },
  { value: "MONDAY", label: "الإثنين" },
  { value: "TUESDAY", label: "الثلاثاء" },
  { value: "WEDNESDAY", label: "الأربعاء" },
  { value: "THURSDAY", label: "الخميس" },
  { value: "FRIDAY", label: "الجمعة" },
];

const TYPES: { value: AvailabilityRuleType; label: string }[] = [
  { value: "DAILY", label: "يومي" },
  { value: "WEEKLY", label: "أسبوعي" },
  { value: "CUSTOM", label: "تاريخ محدد" },
];

const TYPE_LABELS: Record<AvailabilityRuleType, string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  CUSTOM: "تاريخ محدد",
};

interface RuleFormDialogProps {
  /** Element that opens the dialog when clicked. */
  trigger: ReactNode;
  /** Pass an existing rule to edit it; omit to create a new one. */
  rule?: AvailabilityRule;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateAvailabilityRulePayload) => void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function RuleFormDialog({
  trigger,
  rule,
  isSubmitting,
  onSubmit,
}: RuleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AvailabilityRuleType>(rule?.type ?? "DAILY");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    rule?.dayOfWeek ?? "SATURDAY",
  );
  const [customDate, setCustomDate] = useState(
    toDateInputValue(rule?.customDate),
  );
  const [startTime, setStartTime] = useState(rule?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(rule?.endTime ?? "10:00");

  const isEditMode = Boolean(rule);

  // Reset the form to the rule's current values every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setType(rule?.type ?? "DAILY");
    setDayOfWeek(rule?.dayOfWeek ?? "SATURDAY");
    setCustomDate(toDateInputValue(rule?.customDate));
    setStartTime(rule?.startTime ?? "09:00");
    setEndTime(rule?.endTime ?? "10:00");
  }, [open, rule]);

  const isTimeValid = startTime < endTime;
  const isDateValid = type !== "CUSTOM" || Boolean(customDate);
  const canSubmit = isTimeValid && isDateValid && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;

    const payload: CreateAvailabilityRulePayload =
      type === "DAILY"
        ? { type: "DAILY", startTime, endTime }
        : type === "WEEKLY"
          ? { type: "WEEKLY", dayOfWeek, startTime, endTime }
          : { type: "CUSTOM", customDate, startTime, endTime };

    onSubmit(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل موعد الإتاحة" : "إضافة موعد إتاحة"}
          </DialogTitle>
          <DialogDescription>
            حدد نوع التكرار والوقت الذي تكون فيه متاحًا لاستقبال الحجوزات.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rule-type">النوع</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as AvailabilityRuleType)}
            >
              <SelectTrigger id="rule-type">
                <SelectValue>{TYPE_LABELS[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "WEEKLY" && (
            <div className="grid gap-2">
              <Label htmlFor="rule-day">اليوم</Label>
              <Select
                value={dayOfWeek}
                onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}
              >
                <SelectTrigger id="rule-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "CUSTOM" && (
            <div className="grid gap-2">
              <Label htmlFor="rule-date">التاريخ</Label>
              <Input
                id="rule-date"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rule-start">من</Label>
              <Input
                id="rule-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rule-end">إلى</Label>
              <Input
                id="rule-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {!isTimeValid && (
            <p className="text-sm text-destructive">
              وقت النهاية يجب أن يكون بعد وقت البداية
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            إلغاء
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "حفظ التعديل" : "إضافة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
