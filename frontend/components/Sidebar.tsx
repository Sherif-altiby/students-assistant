"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutGrid,
  ListChecks,
  Repeat,
  HeartHandshake,
  MessageCircleQuestion,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Table,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutGrid },
  { href: "/dashboard/tasks", label: "المهام", icon: ListChecks },
  { href: "/dashboard/habits", label: "العادات", icon: Repeat },
  { href: "/dashboard/tables", label: "الجداول", icon: Table },
  { href: "/dashboard/support", label: "الدعم النفسي", icon: HeartHandshake },
  { href: "/dashboard/consultations", label: "الاستشارات", icon: MessageCircleQuestion,},
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Collapsed by default on small screens, expanded on md+ initially
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 768px)");
    setCollapsed(mq.matches);

    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  return (
    <aside
      className={cn(
        "group relative flex h-screen flex-col border-l border-border bg-card py-6 transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20 px-2" : "w-64 px-4",
        // Avoid a flash of the wrong width before we've read matchMedia
        !mounted && "invisible",
      )}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "توسيع القائمة" : "طي القائمة"}
        className={cn(
          "absolute top-6  z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          collapsed ? "left-5" : "left-3",
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4.5 w-4.5" />
        ) : (
          <PanelLeftClose className="h-4.5 w-4.5" />
        )}
      </button>

      {/* Logo / brand */}
      <div className={cn("mb-8", collapsed ? "px-1" : "px-3")}>
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display text-lg font-extrabold text-primary block leading-tight truncate">
                لوحة التحكم
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          "mt-6 border-t border-border pt-4",
          collapsed && "flex flex-col items-center",
        )}
      >
        {user && !collapsed && (
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        )}
        {user && collapsed && (
          <div
            title={`${user.name} — ${user.email}`}
            className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {user.name?.charAt(0)}
          </div>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? "تسجيل الخروج" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "تسجيل الخروج"}
        </button>
      </div>
    </aside>
  );
}
