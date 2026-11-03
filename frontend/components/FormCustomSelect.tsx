
import { useId } from "react";

import {
  CustomSelect,
  type SelectOption,
} from "@/components/ui/CustomSelect";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";

interface FormCustomSelectProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly (SelectOption & { value: T })[];
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export function FormCustomSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  hint,
  className,
  disabled,
  required,
  id,
}: FormCustomSelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const hasError = Boolean(error);
  const hasMessage = Boolean(error || hint);

  return (
    <div className={cn("group space-y-2.5", className)}>
      {/* Label */}
      <Label
        htmlFor={selectId}
        className={cn(
          "text-sm font-semibold tracking-tight transition-colors",
          hasError
            ? "text-destructive"
            : "text-foreground group-focus-within:text-primary",
          disabled && "opacity-50",
        )}
      >
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="ms-1 text-destructive"
          >
            *
          </span>
        )}
      </Label>

      {/* Select */}
      <div
        className={cn(
          "relative rounded-xl transition-all duration-200",
          hasError && [
            "rounded-xl",
            "[&_[data-slot=trigger]]:border-destructive/60",
            "[&_[data-slot=trigger]]:bg-destructive/[0.025]",
          ],
        )}
      >
        <CustomSelect
          id={selectId}
          value={value}
          onChange={(selectedValue) => {
            const option = options.find(
              (item) => item.value === selectedValue,
            );

            if (option) onChange(option.value);
          }}
          options={options}
          placeholder={placeholder}
          hasError={hasError}
          disabled={disabled}
        />
      </div>

      {/* Feedback */}
      {hasMessage && (
        <div className="min-h-5">
          {hasError ? (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <CircleAlert
                aria-hidden="true"
                className="size-3.5 shrink-0"
              />
              <span>{error}</span>
            </p>
          ) : hint ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
