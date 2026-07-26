import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { DoctorSummary } from "@/lib/support";

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

      <CardContent className="flex-1">
        <Badge variant={isAvailable ? "default" : "secondary"}>
          {isAvailable ? "متاح للحجز" : "غير متاح حاليًا"}
        </Badge>
      </CardContent>

      <CardFooter>
        {isAvailable ? (
          <Button className="w-full">
            <Link href={`doctors/${doctor.id}`}>عرض المواعيد</Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
            عرض المواعيد
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}