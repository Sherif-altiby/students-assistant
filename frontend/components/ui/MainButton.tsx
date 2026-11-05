import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

type MainButtonProps = Omit<ComponentProps<typeof Button>, "title"> & {
  title: string;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  loading?: boolean;
  loadingTitle?: string;
  fullWidth?: boolean;
  iconOnly?: boolean;
};

const MainButton = ({
  title,
  icon,
  iconPosition = "start",
  loading = false,
  loadingTitle,
  fullWidth = false,
  iconOnly = false,
  variant = "default",
  disabled,
  className,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: MainButtonProps) => {
  const isDisabled = disabled || loading;

  const leading = loading ? (
    <Loader2
      className="size-4 shrink-0 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  ) : iconPosition === "start" ? (
    icon
  ) : null;

  const trailing = !loading && iconPosition === "end" ? icon : null;

  return (
    <Button
      type={type}
      disabled={isDisabled}
      variant={variant}
      aria-label={iconOnly ? (ariaLabel ?? title) : ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        variant === "default" && !iconOnly
          ? [
              "group relative inline-flex h-12 items-center justify-center gap-2.5",
              "select-none whitespace-nowrap px-5",
              "overflow-hidden rounded-xl",
              "bg-gradient-to-b from-primary to-primary/90",
              "text-sm font-semibold tracking-tight text-primary-foreground",
              "shadow-[0_2px_5px_-2px_hsl(var(--primary)/0.5)]",
              "border border-primary/20",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-0.5",
              "hover:from-primary/95 hover:to-primary",
              "hover:shadow-[0_6px_16px_-5px_hsl(var(--primary)/0.55)]",
              "active:translate-y-0 active:scale-[0.98]",
              "active:shadow-sm",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "[&_svg]:size-4 [&_svg]:shrink-0",
              "[&_svg]:transition-transform [&_svg]:duration-200",
              "disabled:pointer-events-none disabled:translate-y-0",
              "disabled:cursor-not-allowed disabled:opacity-55",
              "disabled:shadow-none",
              "motion-reduce:transform-none motion-reduce:transition-none",
              "motion-reduce:hover:translate-y-0",
              "motion-reduce:active:scale-100",
            ]
          : [
              "group",
              "group/button inline-flex items-center justify-center gap-2 whitespace-nowrap",
              "[&_svg]:size-4 [&_svg]:shrink-0",
            ],
        fullWidth && "w-full",
        !iconOnly &&
          !loading &&
          iconPosition === "start" &&
          "[&:hover>svg]:-translate-x-0.5",

        className,
      )}
      {...props}
    >
      {leading}

      <span className={iconOnly ? "sr-only" : "relative"}>
        {loading && loadingTitle ? loadingTitle : title}
      </span>

      {trailing && (
        <span className="inline-flex items-center transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none">
          {trailing}
        </span>
      )}
    </Button>
  );
};

export default MainButton;
