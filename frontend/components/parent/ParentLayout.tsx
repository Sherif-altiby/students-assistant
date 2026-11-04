"use client";

import {
  BarChart3,
  BookOpen,
  House,
  ListTodo,
  Repeat2,
  Table2,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header/Header";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";
import { listParentStudents } from "@/lib/parent";

const STUDENT_SECTIONS = [
  { slug: "", label: "نظرة عامة", icon: House },
  { slug: "analytics", label: "التحليلات والرسوم", icon: BarChart3 },
  { slug: "tasks", label: "المهام", icon: ListTodo },
  { slug: "habits", label: "العادات", icon: Repeat2 },
  { slug: "tables", label: "جداول المذاكرة", icon: Table2 },
  { slug: "lessons", label: "الدروس", icon: BookOpen },
] satisfies Array<Pick<SidebarItem, "label" | "icon"> & { slug: string }>;

export function ParentLayout({ children }: { children: React.ReactNode }) {
  const studentsQuery = useQuery({
    queryKey: ["parent", "students"],
    queryFn: listParentStudents,
  });
  const linkedStudents =
    studentsQuery.data?.filter((link) => link.status === "ACTIVE") ?? [];

  const items: SidebarItem[] = [
    {
      href: "/parent",
      label: "الأبناء وطلبات الربط",
      icon: Users,
    },
    ...linkedStudents.map(({ student }) => ({
      href: `/parent/students/${student.id}`,
      label: student.name,
      icon: House,
      children: STUDENT_SECTIONS.map(({ slug, label, icon }) => ({
        href: `/parent/students/${student.id}${slug ? `/${slug}` : ""}`,
        label,
        icon,
      })),
    })),
  ];

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar items={items} title="بوابة ولي الأمر" />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto custom-scrollbar">
        <Header showNotifications={false} />
        {children}
      </main>
    </div>
  );
}
