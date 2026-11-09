"use client";

import type { ReactNode } from "react";
import { Check, CalendarDays, ChevronDown, Minus, Plus } from "lucide-react";
import { FormCustomSelect } from "@/components/FormCustomSelect";
import { FormDatePicker } from "@/components/FormDatePicker";
import { FormInput } from "@/components/FormInput";
import {
  STUDY_TABLE_CREATION_MODE_OPTIONS,
  STUDY_TABLE_TYPE_OPTIONS,
  STUDY_TABLE_WEEKDAYS,
} from "@/constants";
import { cn } from "@/lib/utils";
import type { AvailableStudyMonth, StudyTableType } from "@/types/study-table";

const selectClass =
  "h-11 w-full appearance-none rounded-[var(--radius-md)] border border-input bg-background px-3 pe-10 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

export function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg,0.75rem)] border bg-muted/20 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:bg-muted",
      )}
    >
      {selected && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

export function StudyTableBasicsFields({
  title,
  type,
  mode,
  onTitleChange,
  onTypeChange,
  onModeChange,
}: {
  title: string;
  type: StudyTableType;
  mode: "generate" | "empty";
  onTitleChange: (value: string) => void;
  onTypeChange: (value: StudyTableType) => void;
  onModeChange: (value: "generate" | "empty") => void;
}) {
  return (
    <Section title="الأساسيات">
      <div className="grid gap-3 sm:grid-cols-3">
        <FormInput
          label="عنوان الجدول"
          value={title}
          maxLength={255}
          required
          onChange={(event) => onTitleChange(event.target.value)}
        />
        <FormCustomSelect
          label="نوع الجدول"
          value={type}
          onChange={onTypeChange}
          options={STUDY_TABLE_TYPE_OPTIONS}
        />
        <FormCustomSelect
          label="طريقة الإنشاء"
          value={mode}
          onChange={onModeChange}
          options={STUDY_TABLE_CREATION_MODE_OPTIONS}
        />
      </div>
    </Section>
  );
}

export function StudyTablePeriodFields({
  type,
  startDate,
  endDate,
  months,
  selectedMonth,
  selectedMonthKey,
  monthsLoading,
  monthsError,
  today,
  onStartDateChange,
  onEndDateChange,
  onMonthChange,
}: {
  type: StudyTableType;
  startDate: string;
  endDate: string;
  months: AvailableStudyMonth[];
  selectedMonth?: AvailableStudyMonth;
  selectedMonthKey: string;
  monthsLoading: boolean;
  monthsError: boolean;
  today?: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onMonthChange: (value: string) => void;
}) {
  return (
    <Section title="الفترة">
      {type === "MONTHLY" ? (
        <div className="grid items-end gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            الشهر
            <span className="relative block">
              <select
                className={selectClass}
                value={
                  selectedMonth
                    ? `${selectedMonth.year}-${selectedMonth.month}`
                    : selectedMonthKey
                }
                disabled={monthsLoading || monthsError}
                onChange={(event) => onMonthChange(event.target.value)}
              >
                {months.map((option) => (
                  <option
                    key={`${option.year}-${option.month}`}
                    value={`${option.year}-${option.month}`}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
            </span>
          </label>
          {monthsLoading && (
            <p className="pb-3 text-sm text-muted-foreground">
              جارٍ تحميل الأشهر المتاحة...
            </p>
          )}
          {monthsError && (
            <p role="alert" className="pb-3 text-sm text-destructive">
              تعذر تحميل الأشهر المتاحة
            </p>
          )}
          {selectedMonth?.isCurrent && today && (
            <p className="flex items-center gap-1.5 pb-3 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              سيبدأ الجدول من اليوم {today}
            </p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            type === "WEEKLY" ? "sm:grid-cols-1" : "sm:grid-cols-2",
          )}
        >
          <FormDatePicker
            label="تاريخ البداية"
            value={startDate}
            required
            onChange={onStartDateChange}
          />
          {type !== "WEEKLY" && (
            <FormDatePicker
              label="تاريخ النهاية"
              value={endDate}
              minDate={startDate}
              required
              onChange={onEndDateChange}
            />
          )}
        </div>
      )}
    </Section>
  );
}

export function StudyTableScheduleFields({
  weekdays,
  maxSessionsPerDay,
  onToggleWeekday,
  onMaxSessionsChange,
}: {
  weekdays: number[];
  maxSessionsPerDay: number;
  onToggleWeekday: (index: number) => void;
  onMaxSessionsChange: (value: number) => void;
}) {
  return (
    <Section title="جدولة المذاكرة">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">أيام المذاكرة</legend>
        <div className="flex flex-wrap gap-2">
          {STUDY_TABLE_WEEKDAYS.map((day, index) => (
            <Chip
              key={day}
              selected={weekdays.includes(index)}
              onClick={() => onToggleWeekday(index)}
            >
              {day}
            </Chip>
          ))}
        </div>
        {weekdays.length === 0 && (
          <p role="alert" className="text-xs text-destructive">
            اختر يوماً واحداً على الأقل.
          </p>
        )}
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div>
          <p id="sessions-label" className="text-sm font-medium">
            الحد الأقصى للجلسات يومياً
          </p>
          <p className="text-xs text-muted-foreground">من 1 إلى 6 جلسة</p>
        </div>
        <div
          role="group"
          aria-labelledby="sessions-label"
          className="flex h-11 items-center rounded-[var(--radius-md)] border bg-background"
        >
          <button
            type="button"
            aria-label="تقليل"
            disabled={maxSessionsPerDay <= 1}
            onClick={() => onMaxSessionsChange(maxSessionsPerDay - 1)}
            className="grid size-11 place-items-center rounded-s-[var(--radius-md)] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            value={maxSessionsPerDay}
            onChange={(event) =>
              onMaxSessionsChange(Number(event.target.value))
            }
            className="h-full w-14 bg-transparent text-center text-sm font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            aria-label="زيادة"
            disabled={maxSessionsPerDay >= 50}
            onClick={() => onMaxSessionsChange(maxSessionsPerDay + 1)}
            className="grid size-11 place-items-center rounded-e-[var(--radius-md)] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </Section>
  );
}
