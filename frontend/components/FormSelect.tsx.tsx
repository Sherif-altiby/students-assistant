import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FormSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  className?: string;
}

export function FormSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = "اختر...",
  error,
  className,
}: FormSelectProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  // Handle the null case by converting to empty string or keeping current value
  const handleValueChange = (newValue: string | null) => {
    if (newValue !== null) {
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger id={id} className={error ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}