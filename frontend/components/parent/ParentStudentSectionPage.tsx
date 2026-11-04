"use client";

import { useParams } from "next/navigation";
import { BarChart3, BookOpen, ListTodo, Repeat2, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ParentStudentSectionContent, type ParentStudentSection } from "@/components/parent/ParentStudentSectionContent";
import { useParentStudentOverview } from "@/hooks/useParentStudentOverview";

const SECTION_DETAILS: Record<
  ParentStudentSection,
  { title: string; description: string; icon: typeof BookOpen }
> = {
  analytics: {
    title: "تحليلات التقدم",
    description: "رسوم تفصيلية لمتابعة إنجازات الطالب في مختلف الجوانب.",
    icon: BarChart3,
  },
  tasks: {
    title: "المهام",
    description: "قائمة مهام الطالب ومؤشرات الإنجاز.",
    icon: ListTodo,
  },
  habits: {
    title: "العادات",
    description: "متابعة العادات اليومية وسجل إنجازها.",
    icon: Repeat2,
  },
  tables: {
    title: "جداول المذاكرة",
    description: "الجلسات المجدولة وحالة إنجاز كل جلسة.",
    icon: Table2,
  },
  lessons: {
    title: "الدروس",
    description: "مواعيد الدروس وسجل الدروس التي أتمها الطالب.",
    icon: BookOpen,
  },
};

export function ParentStudentSectionPage({
  section,
}: {
  section: ParentStudentSection;
}) {
  const { studentId } = useParams<{ studentId: string }>();
  const overviewQuery = useParentStudentOverview(studentId);
  const details = SECTION_DETAILS[section];
  const Icon = details.icon;

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
    <div dir="rtl" className="space-y-5 p-4 sm:p-6">
      <PageHeader
        title={`${details.title} · ${overviewQuery.data.student.name}`}
        description={details.description}
        action={
          <span className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden="true" />
            عرض للمتابعة فقط
          </span>
        }
      />
      <ParentStudentSectionContent
        section={section}
        overview={overviewQuery.data}
      />
    </div>
  );
}
