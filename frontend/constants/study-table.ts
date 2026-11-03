import type { StudyTableType } from "@/types/study-table";

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
