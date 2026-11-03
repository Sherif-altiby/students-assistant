
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { CircleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormInputProps extends ComponentPropsWithoutRef<"input"> {
  label: string;
  error?: string;
  hint?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      hint,
      startIcon,
      endAdornment,
      className,
      id,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    const hasError = Boolean(error);
    const hasMessage = Boolean(error || hint);

    return (
      <div className="group ">
        {/* Label */}
        <div className="flex items-center justify-between">
          <Label
            htmlFor={inputId}
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
        </div>

        {/* Input wrapper */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-y-0 start-3.5 z-10",
                "flex items-center justify-center",
                "text-muted-foreground transition-colors",
                "group-focus-within:text-primary",
                "[&_svg]:size-[18px]",
                hasError && "text-destructive",
              )}
            >
              {startIcon}
            </span>
          )}

          <Input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            className={cn(
              // Base
              "h-12 w-full rounded-xl border",
              "bg-background px-4 text-sm",
              "font-medium placeholder:font-normal",
              "placeholder:text-muted-foreground/60",

              // Transitions
              "transition-all duration-200 ease-out",

              // Hover
              "hover:border-muted-foreground/40",

              // Focus
              "focus-visible:border-primary",
              "focus-visible:ring-[3px]",
              "focus-visible:ring-primary/15",
              "focus-visible:ring-offset-0",

              // Icons
              startIcon && "ps-11",
              endAdornment && "pe-12",

              // Error
              hasError && [
                "border-destructive/60",
                "bg-destructive/[0.025]",
                "focus-visible:border-destructive",
                "focus-visible:ring-destructive/15",
              ],

              // Disabled
              "disabled:cursor-not-allowed",
              "disabled:bg-muted/60",
              "disabled:opacity-60",

              className,
            )}
            {...props}
          />

          {/* End adornment */}
          {endAdornment && (
            <div
              className={cn(
                "absolute inset-y-0 end-2 z-10",
                "flex items-center justify-center",
                "[&_button]:rounded-lg",
              )}
            >
              {endAdornment}
            </div>
          )}
        </div>

        {/* Feedback message */}
        {hasMessage && (
          <div
            id={messageId}
            className="min-h-5"
          >
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
  },
);

FormInput.displayName = "FormInput";
