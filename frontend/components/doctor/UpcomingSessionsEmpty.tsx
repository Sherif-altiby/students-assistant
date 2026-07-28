import { CalendarX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface UpcomingSessionsEmptyProps {
  message?: string;
}

export function UpcomingSessionsEmpty({ message }: UpcomingSessionsEmptyProps) {
  return (
    <Card className="border-border border-dashed shadow-none md:col-span-3">
      <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CalendarX className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {message ?? "لا توجد جلسات قادمة حالياً"}
        </p>
        <p className="text-xs text-muted-foreground">
          ستظهر هنا أقرب الجلسات فور تأكيد الحجوزات
        </p>
      </CardContent>
    </Card>
  );
}