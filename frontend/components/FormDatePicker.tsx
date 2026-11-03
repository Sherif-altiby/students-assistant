"use client";

import { useState } from "react";
import { ar } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

function parseDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "long",
  }).format(date);
}

export function FormDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  required,
  disabled,
  error,
  className,
  id,
}: FormDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDate(value);
  const minimumDate = minDate ? parseDate(minDate) : undefined;
  const maximumDate = maxDate ? parseDate(maxDate) : undefined;
  const pickerId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={pickerId} className="mb-3">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={pickerId}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-required={required}
              aria-invalid={Boolean(error)}
              className={cn(
                "h-11 w-full justify-between px-3.5 text-right font-normal",
                !selectedDate && "text-muted-foreground",
                error && "border-destructive focus-visible:ring-destructive/30",
              )}
            >
              <span>{selectedDate ? formatDate(value) : "اختر التاريخ"}</span>
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0" dir="rtl">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateString(date));
              setOpen(false);
            }}
            disabled={(date) =>
              Boolean(
                (minimumDate && date < minimumDate) ||
                  (maximumDate && date > maximumDate),
              )
            }
            locale={ar}
            defaultMonth={selectedDate}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
