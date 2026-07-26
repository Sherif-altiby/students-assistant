import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/support";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "بانتظار الرد", variant: "outline" },
  ACCEPTED: { label: "مقبول", variant: "default" },
  REJECTED: { label: "مرفوض", variant: "destructive" },
  CANCELLED: { label: "ملغي", variant: "destructive" },
  COMPLETED: { label: "مكتمل", variant: "secondary" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}