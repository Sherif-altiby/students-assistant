import {
  BookOpen,
  House,
  ListTodo,
  Repeat2,
  Table2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ParentHabitFilter,
  ParentLinkStatus,
  ParentOverview,
  ParentStudySessionFilter,
  ParentTaskFilter,
} from "@/types/parent";
import type { StudyTableType } from "@/types/study-table";
import type { AdminRole } from "@/types/admin";

export const PARENT_STUDENTS_QUERY_KEY = ["parent", "students"] as const;

export const PARENT_STUDENT_NAV_SECTIONS = [
  { slug: "", label: "نظرة عامة", icon: House },
  { slug: "tasks", label: "المهام", icon: ListTodo },
  { slug: "habits", label: "العادات", icon: Repeat2 },
  { slug: "tables", label: "جداول المذاكرة", icon: Table2 },
  { slug: "lessons", label: "الدروس", icon: BookOpen },
] as const;

export const PARENT_LINK_STATUS_LABELS: Record<ParentLinkStatus, string> = {
  ACTIVE: "تم الربط",
  PENDING: "بانتظار موافقة الطالب",
  REJECTED: "تم رفض الطلب",
};

export const PARENT_PROGRESS_METRICS: Array<{
  key: keyof ParentOverview["summary"];
  label: string;
  icon: LucideIcon;
  totalKey?: keyof ParentOverview["summary"];
}> = [
  { key: "completedTaskCount", label: "إنجازات المهام", icon: ListTodo },
  { key: "habitCompletionCount", label: "إنجازات العادات", icon: Repeat2 },
  {
    key: "completedStudySessionCount",
    label: "جلسات مكتملة",
    icon: Table2,
    totalKey: "studySessionCount",
  },
  { key: "completedLessonCount", label: "دروس مكتملة", icon: BookOpen },
];

export const PARENT_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const PARENT_TASK_FILTER_OPTIONS: readonly {
  id: ParentTaskFilter;
  label: string;
}[] = [
  { id: "all", label: "الكل" },
  { id: "daily", label: "يومية" },
  { id: "today", label: "لليوم" },
  { id: "pending", label: "لم تُنجز اليوم" },
];

export const PARENT_HABIT_FILTER_OPTIONS: readonly {
  id: ParentHabitFilter;
  label: string;
}[] = [
  { id: "all", label: "الكل" },
  { id: "done", label: "أُنجزت اليوم" },
  { id: "pending", label: "لم تُنجز اليوم" },
];

export const PARENT_STUDY_SESSION_FILTER_OPTIONS: readonly {
  id: ParentStudySessionFilter;
  label: string;
}[] = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "غير مكتملة" },
  { id: "overdue", label: "متأخرة" },
  { id: "done", label: "مكتملة" },
];

export const ADMIN_USER_FILTER_OPTIONS: readonly {
  id: AdminRole;
  label: string;
}[] = [
  { id: "ALL", label: "كل الحسابات" },
  { id: "USER", label: "الطلاب" },
  { id: "PARENT", label: "أولياء الأمور" },
  { id: "DOCTOR", label: "الأطباء" },
  { id: "ADMIN", label: "المشرفون" },
];

export const ADMIN_ROLE_LABELS: Record<Exclude<AdminRole, "ALL">, string> = {
  USER: "طالب",
  PARENT: "ولي أمر",
  DOCTOR: "طبيب",
  ADMIN: "مشرف",
};

export const STUDY_TABLE_TYPE_OPTIONS: readonly {
  value: StudyTableType;
  label: string;
}[] = [
  { value: "WEEKLY", label: "أسبوعي" },
  { value: "MONTHLY", label: "شهري" },
  { value: "CUSTOM", label: "فترة مخصصة" },
  { value: "GLOBAL", label: "خطة شاملة" },
];

export const STUDY_TABLE_CREATION_MODE_OPTIONS = [
  { value: "generate", label: "توليد الجلسات تلقائياً" },
  { value: "empty", label: "إنشاء جدول فارغ" },
] as const;

export const STUDY_TABLE_WEEKDAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;
