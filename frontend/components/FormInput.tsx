import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          ref={ref}
          id={inputId}
          className={cn(error && "border-destructive", className)}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";