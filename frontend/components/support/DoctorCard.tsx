import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { DoctorSummary } from "@/types/support";
import { Star } from "lucide-react";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  const isAvailable = doctor.status === "ACTIVE";
  const rating = doctor.averageRating ?? 0;
  const totalRatings = doctor.totalRatings ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials(doctor.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{doctor.name}</p>
          {doctor.country && (
            <p className="truncate text-sm text-muted-foreground">{doctor.country}</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-medium text-foreground">
            {rating > 0 ? rating.toFixed(1) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {totalRatings > 0 ? `(${totalRatings})` : "(لا توجد تقييمات)"}
          </span>
        </div>

        <Badge variant={isAvailable ? "default" : "secondary"}>
          {isAvailable ? "متاح للحجز" : "غير متاح حاليًا"}
        </Badge>
      </CardContent>

      <CardFooter>
        {isAvailable ? (
          <Link href={`/dashboard/doctors/${doctor.id}`} className="w-full">
            <Button className="w-full">عرض المواعيد</Button>
          </Link>
        ) : (
          <Button className="w-full" disabled>
            عرض المواعيد
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}