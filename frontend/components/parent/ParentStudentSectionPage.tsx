"use client";

import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ParentStudentSectionContent } from "@/components/parent/ParentStudentSectionContent";
import type { ParentStudentSection } from "@/types/parent";
import { useParentStudentOverview } from "@/hooks/useParentStudentOverview";

export function ParentStudentSectionPage({
  section,
}: {
  section: ParentStudentSection;
}) {
  const { studentId } = useParams<{ studentId: string }>();
  const overviewQuery = useParentStudentOverview(studentId);

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
        <div className="h-72 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="p-4 sm:p-6">
        <Card
          role="alert"
          className="gap-2 border border-destructive/20 bg-destructive/5 p-5 text-destructive shadow-none ring-0"
        >
          <h1 className="font-bold">تعذر تحميل بيانات الطالب</h1>
          <p className="text-sm">
            قد يكون طلب الربط غير نشط. تحقق من حالة الربط وحاول مرة أخرى.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <ParentStudentSectionContent
        section={section}
        overview={overviewQuery.data}
      />
    </div>
  );
}
