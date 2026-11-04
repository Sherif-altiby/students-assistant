"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ParentStudentProgress } from "@/components/parent/ParentStudentProgress";
import { useParentStudentOverview } from "@/hooks/useParentStudentOverview";

export default function ParentStudentPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const overviewQuery = useParentStudentOverview(studentId);

  return (
    <div dir="rtl" className="flex flex-col gap-2">
      <Link
        href="/parent"
        className="mx-4 mt-4 inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:mx-6"
      >
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
        العودة إلى الأبناء
      </Link>

      {overviewQuery.isLoading ? (
        <div className="space-y-4 p-4 sm:p-6">
          <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/50" />
            ))}
          </div>
        </div>
      ) : overviewQuery.isError ? (
        <Card
          role="alert"
          className="gap-2 border border-destructive/20 bg-destructive/5 p-5 text-destructive shadow-none ring-0"
        >
          <h1 className="font-bold">تعذر تحميل بيانات الطالب</h1>
          <p className="text-sm">
            قد يكون طلب الربط غير نشط أو لم يعد حساب الطالب متاحًا. تحقق من حالة
            الربط وحاول مرة أخرى.
          </p>
        </Card>
      ) : overviewQuery.data ? (
        <div>
          <PageHeader
            className="px-4 pt-3 sm:px-6"
            title={overviewQuery.data.student.name}
            description="نظرة عامة على تقدم الطالب. جميع البيانات للمتابعة فقط."
            action={
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {overviewQuery.data.student.level ?? "المرحلة غير محددة"}
              </div>
            }
          />
          <ParentStudentProgress overview={overviewQuery.data} />
        </div>
      ) : null}
    </div>
  );
}
