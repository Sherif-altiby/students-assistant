import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DoctorStatsEmptyProps {
  message?: string;
}

export function DoctorStatsEmpty({ message }: DoctorStatsEmptyProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          {message ?? "لا توجد إحصائيات متاحة حالياً"}
        </p>
      </CardContent>
    </Card>
  );
}