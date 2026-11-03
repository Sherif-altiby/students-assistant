
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  hasError?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "اختر...",
  hasError,
  id,
  disabled,
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;

  const selected = options.find((option) => option.value === value);

  const firstEnabledIndex = options.findIndex(
    (option) => !option.disabled,
  );

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keep highlighted option visible.
  useEffect(() => {
    if (open) {
      optionRefs.current[highlighted]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlighted, open]);

  function openDropdown() {
    if (disabled) return;

    const selectedIndex = options.findIndex(
      (option) => option.value === value && !option.disabled,
    );

    setHighlighted(
      selectedIndex >= 0 ? selectedIndex : firstEnabledIndex,
    );

    setOpen(true);
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) return;

    onChange(option.value);
    setOpen(false);
  }

  function moveHighlight(direction: 1 | -1) {
    setHighlighted((current) => {
      let next = current;

      for (let i = 0; i < options.length; i++) {
        next += direction;

        if (next < 0) next = options.length - 1;
        if (next >= options.length) next = 0;

        if (!options[next].disabled) return next;
      }

      return current;
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (
        ["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)
      ) {
        e.preventDefault();
        openDropdown();

        if (e.key === "ArrowUp") {
          const lastEnabledIndex = options.reduce(
            (last, option, index) =>
              option.disabled ? last : index,
            -1,
          );

          setHighlighted(lastEnabledIndex);
        }
      }

      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveHighlight(1);
        break;

      case "ArrowUp":
        e.preventDefault();
        moveHighlight(-1);
        break;

      case "Home":
        e.preventDefault();
        setHighlighted(firstEnabledIndex);
        break;

      case "End": {
        e.preventDefault();

        const lastEnabledIndex = options.reduce(
          (last, option, index) =>
            option.disabled ? last : index,
          -1,
        );

        setHighlighted(lastEnabledIndex);
        break;
      }

      case "Enter":
      case " ":
        e.preventDefault();

        if (options[highlighted]) {
          selectOption(options[highlighted]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;

      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-invalid={hasError || undefined}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openDropdown();
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          // Base
          "flex h-12 w-full items-center justify-between",
          "rounded-xl border bg-background px-4",
          "text-sm font-medium text-foreground",
          "outline-none transition-all duration-200 ease-out",

          // Hover
          "hover:border-muted-foreground/40",

          // Focus
          "focus-visible:border-primary",
          "focus-visible:ring-[3px]",
          "focus-visible:ring-primary/15",
          "focus-visible:ring-offset-0",

          // Open
          open && "border-primary/60 ring-[3px] ring-primary/10",

          // Error
          hasError && [
            "border-destructive/60",
            "bg-destructive/[0.025]",
            "hover:border-destructive",
            "focus-visible:border-destructive",
            "focus-visible:ring-destructive/15",
          ],

          // Disabled
          "disabled:cursor-not-allowed",
          "disabled:bg-muted/60",
          "disabled:opacity-60",
        )}
      >
        <span
          className={cn(
            "truncate text-start",
            !selected && "font-normal text-muted-foreground",
          )}
        >
          {selected?.label ?? placeholder}
        </span>

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ms-3 size-4 shrink-0 text-muted-foreground",
            "transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={id}
          className={cn(
            "absolute start-0 top-full z-50 mt-2",
            "max-h-60 w-full overflow-y-auto",
            "rounded-xl border border-border/80",
            "bg-popover p-1.5 text-popover-foreground",
            "shadow-lg shadow-black/5",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1",
            "duration-150",
          )}
        >
          {options.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              لا توجد خيارات متاحة
            </li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlighted;

              return (
                <li
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlighted(index);
                    }
                  }}
                  onClick={() => selectOption(option)}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center",
                    "justify-between gap-3 rounded-lg px-3 py-2",
                    "text-sm transition-colors duration-150",

                    isHighlighted &&
                      !option.disabled &&
                      "bg-accent text-accent-foreground",

                    !isHighlighted &&
                      !option.disabled &&
                      "text-popover-foreground hover:bg-accent/60",

                    option.disabled &&
                      "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="truncate">{option.label}</span>

                  {isSelected && (
                    <Check
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
