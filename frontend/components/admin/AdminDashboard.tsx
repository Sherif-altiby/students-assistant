"use client";

import { useState } from "react";
import { ADMIN_DASHBOARD_VIEWS } from "@/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import MainButton from "@/components/ui/MainButton";
import { AdminSuggestionsSection } from "@/components/admin/AdminSuggestionsSection";
import { AdminUsersSection } from "@/components/admin/AdminUsersSection";

export function AdminDashboard() {
  const [view, setView] =
    useState<(typeof ADMIN_DASHBOARD_VIEWS)[number]["id"]>("users");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="لوحة الإدارة"
        description="إدارة حسابات المنصة ومراجعة اقتراحات الطلاب وأولياء الأمور."
      />
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="أقسام الإدارة"
      >
        {ADMIN_DASHBOARD_VIEWS.map(({ id, label, icon: Icon }) => (
          <MainButton
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            variant={view === id ? "default" : "outline"}
            onClick={() => setView(id)}
            title={label}
            icon={<Icon aria-hidden="true" />}
            className="h-9"
          />
        ))}
      </div>
      {view === "users" ? <AdminUsersSection /> : <AdminSuggestionsSection />}
    </div>
  );
}
