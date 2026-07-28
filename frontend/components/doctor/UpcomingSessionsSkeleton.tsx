import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function UpcomingSessionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pb-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-32" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}