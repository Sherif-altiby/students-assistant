import { Badge } from "@/components/ui/badge";
import type { StudyTableType } from "@/types/study-table";

export function StudyTableTypeBadge({ type }: { type: StudyTableType }) {
  return (
    <Badge variant="secondary">
      {type === "DATE_RANGE" ? "فترة زمنية" : "عدد أيام"}
    </Badge>
  );
}