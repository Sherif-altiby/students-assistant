"use client";

import { House, Users } from "lucide-react";
import { Header } from "@/components/header/Header";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";
import { PARENT_STUDENT_NAV_SECTIONS } from "@/constants";
import { useParentStudents } from "@/hooks/useParentStudents";

export function ParentLayout({ children }: { children: React.ReactNode }) {
  const studentsQuery = useParentStudents();
  const linkedStudents =
    studentsQuery.data?.filter((link) => link.status === "ACTIVE") ?? [];

  const items: SidebarItem[] = [
    {
      href: "/parent",
      label: "الأبناء وطلبات الربط",
      icon: Users,
      exact: true,
    },
    ...linkedStudents.map(({ student }) => ({
      href: `/parent/students/${student.id}`,
      label: student.name,
      icon: House,
      exact: true,
      collapsible: true,
      children: PARENT_STUDENT_NAV_SECTIONS.map(({ slug, label, icon }) => ({
        href: `/parent/students/${student.id}${slug ? `/${slug}` : ""}`,
        label,
        icon,
        exact: true,
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
