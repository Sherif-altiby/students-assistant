import {
  BookOpen,
  CheckCircle2,
  House,
  Lightbulb,
  ListTodo,
  Repeat2,
  Star,
  Table2,
  Users,
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
import type {
  AvailabilityRuleType,
  DayOfWeek,
  DoctorStats,
} from "@/types/support";

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

export const ADMIN_PAGE_SIZE = 10;
export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;
export const ADMIN_USER_SKELETON_ROWS = 5;
export const ADMIN_SUGGESTION_LONG_MESSAGE_LENGTH = 220;

export const ADMIN_DASHBOARD_VIEWS = [
  { id: "users", label: "الحسابات", icon: Users },
  { id: "suggestions", label: "الاقتراحات", icon: Lightbulb },
] as const;

export const ADMIN_USER_STATUS_LABELS: Record<"ACTIVE" | "PENDING", string> = {
  ACTIVE: "نشط",
  PENDING: "بانتظار التفعيل",
};

export const DOCTOR_ALLOWED_ROLES = ["DOCTOR"] as const;
export const DOCTOR_SESSION_SKELETON_ROWS = 3;
export const DOCTOR_RATINGS_MARQUEE_SPEED_SECONDS = 35;
export const DOCTOR_RATING_STAR_COUNT = 5;
export const DOCTOR_SAMPLE_RATINGS = [
  {
    id: "1",
    name: "سارة أحمد",
    score: 5,
    comment: "الجلسة كانت مريحة جدًا وساعدتني أرتب أفكاري قبل الامتحانات.",
  },
  {
    id: "2",
    name: "محمد علي",
    score: 4,
    comment: "الدكتور كان متفهم وأعطاني خطوات عملية للتعامل مع القلق.",
  },
  {
    id: "3",
    name: "ندى خالد",
    score: 5,
    comment: "أول مرة أحس إني اتسمعت فعلاً، شكرًا على الوقت والصبر.",
  },
  {
    id: "4",
    name: "عمر حسن",
    score: 5,
    comment: "نصائح بسيطة وقابلة للتطبيق، حسّت بفرق من نفس اليوم.",
  },
] as const;

export const DOCTOR_STATS_METRICS: readonly {
  key: keyof Pick<
    DoctorStats,
    "completedSessions" | "totalBeneficiaries" | "averageRating"
  >;
  label: string;
  icon: LucideIcon;
  hintKey: "completedSessions" | "totalBeneficiaries" | "rating";
}[] = [
  {
    key: "completedSessions",
    label: "الجلسات المكتملة",
    icon: CheckCircle2,
    hintKey: "completedSessions",
  },
  {
    key: "totalBeneficiaries",
    label: "عدد المستفيدين",
    icon: Users,
    hintKey: "totalBeneficiaries",
  },
  {
    key: "averageRating",
    label: "التقييم العام",
    icon: Star,
    hintKey: "rating",
  },
];

export const DOCTOR_SESSION_LABELS = {
  confirmed: "مؤكدة",
  pendingLink: "بانتظار الرابط",
  today: "اليوم",
  tomorrow: "غدًا",
} as const;

export const DOCTOR_RATING_EMPTY_INITIAL = "؟";
export const DOCTOR_DASHBOARD_FALLBACK_NAME = "الطبيب";

export const AVAILABILITY_RULE_DAY_OPTIONS = [
  { value: "SATURDAY", label: "السبت" },
  { value: "SUNDAY", label: "الأحد" },
  { value: "MONDAY", label: "الإثنين" },
  { value: "TUESDAY", label: "الثلاثاء" },
  { value: "WEDNESDAY", label: "الأربعاء" },
  { value: "THURSDAY", label: "الخميس" },
  { value: "FRIDAY", label: "الجمعة" },
] as const satisfies readonly { value: DayOfWeek; label: string }[];

export const AVAILABILITY_RULE_TYPE_OPTIONS = [
  { value: "DAILY", label: "يومي" },
  { value: "WEEKLY", label: "أسبوعي" },
  { value: "CUSTOM", label: "تاريخ محدد" },
] as const satisfies readonly {
  value: AvailabilityRuleType;
  label: string;
}[];

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
