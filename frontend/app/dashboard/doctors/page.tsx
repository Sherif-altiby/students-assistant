"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctors } from "@/hooks/useSupport";
import { Stethoscope } from "lucide-react";
import { DoctorCard } from "@/components/support/DoctorCard";

const PAGE_SIZE = 9;

export default function DoctorsPage() {
  const [page, setPage] = useState(1);
  const { doctors, total, limit, isLoading, isFetching, isError } = useDoctors({
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الأطباء</h1>
        <p className="text-muted-foreground">اختر طبيبًا لعرض مواعيده المتاحة والحجز</p>
      </div>

      {isError && <p className="text-sm text-destructive">تعذر تحميل قائمة الأطباء</p>}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && doctors.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          <Stethoscope className="h-8 w-8" />
          <p className="text-sm">لا يوجد أطباء متاحون حاليًا</p>
        </div>
      )}

      {doctors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}