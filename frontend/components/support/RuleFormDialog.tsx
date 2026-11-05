"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import { FormInput } from "@/components/FormInput";
import MainButton from "@/components/ui/MainButton";
import {
  AVAILABILITY_RULE_DAY_OPTIONS,
  AVAILABILITY_RULE_TYPE_OPTIONS,
} from "@/constants";
import type {
  AvailabilityRule,
  AvailabilityRuleType,
  CreateAvailabilityRulePayload,
  DayOfWeek,
} from "@/lib/support";

interface RuleFormDialogProps {
  /** Element that opens the dialog when clicked. */
  trigger: ReactElement;
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
      <DialogTrigger render={trigger} />
      <DialogContent
        className="sm:max-w-md"
        closeButtonClassName="right-auto left-2"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل موعد الإتاحة" : "إضافة موعد إتاحة"}
          </DialogTitle>
          <DialogDescription>
            حدد نوع التكرار والوقت الذي تكون فيه متاحًا لاستقبال الحجوزات.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <FormCustomSelect
            id="rule-type"
            label="النوع"
            value={type}
            onChange={setType}
            options={AVAILABILITY_RULE_TYPE_OPTIONS}
          />

          {type === "WEEKLY" && (
            <FormCustomSelect
              id="rule-day"
              label="اليوم"
              value={dayOfWeek}
              onChange={setDayOfWeek}
              options={AVAILABILITY_RULE_DAY_OPTIONS}
            />
          )}

          {type === "CUSTOM" && (
            <FormInput
              id="rule-date"
              label="التاريخ"
              type="date"
              value={customDate}
              onChange={(event) => setCustomDate(event.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              id="rule-start"
              label="من"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <FormInput
              id="rule-end"
              label="إلى"
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
          </div>

          {!isTimeValid && (
            <p className="text-sm text-destructive">
              وقت النهاية يجب أن يكون بعد وقت البداية
            </p>
          )}
        </div>

        <DialogFooter>
          <MainButton
            type="button"
            variant="outline"
            title="إلغاء"
            onClick={() => setOpen(false)}
          />
          <MainButton
            type="button"
            title={isEditMode ? "حفظ التعديل" : "إضافة"}
            disabled={!canSubmit}
            loading={isSubmitting}
            loadingTitle="جارٍ الحفظ..."
            onClick={handleSubmit}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
