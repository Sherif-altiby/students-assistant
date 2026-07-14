"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ListChecks,
  Repeat,
  HeartHandshake,
  MessageCircleQuestion,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { logout } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutGrid },
  { href: "/dashboard/tasks", label: "المهام", icon: ListChecks },
  { href: "/dashboard/habits", label: "العادات", icon: Repeat },
  { href: "/dashboard/support", label: "الدعم النفسي", icon: HeartHandshake },
  {
    href: "/dashboard/consultations",
    label: "الاستشارات",
    icon: MessageCircleQuestion,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      router.push("/login");
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-l border-border bg-card px-4 py-6">
      <div className="mb-8 px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold text-primary block leading-tight">
              ثانوية أسيستنت
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              لوحة التحكم
            </span>
          </div>
        </div>
      </div>

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
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-border pt-4">
        {user && (
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
