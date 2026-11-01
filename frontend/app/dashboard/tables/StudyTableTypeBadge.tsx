import { Badge } from "@/components/ui/badge";
import type { StudyTableType } from "@/types/study-table";

export function StudyTableTypeBadge({ type }: { type: StudyTableType }) {
  const labels: Record<StudyTableType, string> = {
    WEEKLY: "أسبوعي",
    MONTHLY: "شهري",
    CUSTOM: "فترة مخصصة",
    GLOBAL: "خطة شاملة",
  };

  return (
    <Badge variant="secondary">
      {labels[type]}
    </Badge>
  );
}