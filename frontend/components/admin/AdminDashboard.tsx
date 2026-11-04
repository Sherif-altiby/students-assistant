"use client";

import { useState } from "react";
import { Lightbulb, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { AdminSuggestionsSection } from "@/components/admin/AdminSuggestionsSection";
import { AdminUsersSection } from "@/components/admin/AdminUsersSection";

type AdminView = "users" | "suggestions";

export function AdminDashboard() {
  const [view, setView] = useState<AdminView>("users");

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
        <Button
          type="button"
          role="tab"
          aria-selected={view === "users"}
          variant={view === "users" ? "default" : "outline"}
          onClick={() => setView("users")}
        >
          <Users className="size-4" aria-hidden="true" />
          الحسابات
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={view === "suggestions"}
          variant={view === "suggestions" ? "default" : "outline"}
          onClick={() => setView("suggestions")}
        >
          <Lightbulb className="size-4" aria-hidden="true" />
          الاقتراحات
        </Button>
      </div>
      {view === "users" ? <AdminUsersSection /> : <AdminSuggestionsSection />}
    </div>
  );
}
