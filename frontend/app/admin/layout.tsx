"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { Header } from "@/components/header/Header";
import { Sidebar, type SidebarItem } from "@/components/Sidebar";
import { LayoutDashboard } from "lucide-react";

const ADMIN_ITEMS: SidebarItem[] = [
  { href: "/admin", label: "لوحة الإدارة", icon: LayoutDashboard, exact: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="flex h-screen bg-paper">
        <Sidebar items={ADMIN_ITEMS} title="بوابة الإدارة" />
        <main className="h-screen min-w-0 flex-1 overflow-y-auto custom-scrollbar">
          <Header showNotifications={false} />
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
