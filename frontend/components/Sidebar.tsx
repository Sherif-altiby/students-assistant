"use client";

import Link from "next/link";
import Image from "next/image";
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
  MessageCircleCode,
  CalendarDays,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { logout } from "@/lib/auth";

export interface SidebarItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
  collapsible?: boolean;
  children?: SidebarItem[];
}

const STUDENT_NAV_ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutGrid },
  { href: "/dashboard/tasks", label: "المهام", icon: ListChecks },
  { href: "/dashboard/habits", label: "العادات", icon: Repeat },
  { href: "/dashboard/tables", label: "الجداول", icon: Table },
  { href: "/dashboard/subjects", label: "المواد الدراسية", icon: BookOpen },
  { href: "/dashboard/lesson-dates", label: "مواعيد الدروس", icon: CalendarDays },
  { href: "/dashboard/support", label: "الدعم النفسي", icon: HeartHandshake },
  { href: "/dashboard/chat", label: "الدردشات", icon: MessageCircleCode },
  // { href: "/dashboard/consultations", label: "الاستشارات", icon: MessageCircleQuestion,},
];

interface SidebarProps {
  items?: SidebarItem[];
  title?: string;
}

export function Sidebar({
  items = STUDENT_NAV_ITEMS,
  title = "لوحة التحكم",
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Collapsed by default on small screens, expanded on md+ initially
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

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
          <Image
            src="/logo.png"
            alt="مُذاكرة"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl object-contain"
            priority
          />
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-display text-lg font-extrabold text-primary block leading-tight truncate">
                {title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const hasActiveChild = item.children?.some(
            (child) =>
              child.exact
                ? pathname === child.href
                : pathname === child.href ||
                  pathname.startsWith(`${child.href}/`),
          );
          const isExpanded = expandedItems[item.href] ?? hasActiveChild ?? false;
          const showChildren = item.collapsible
            ? isExpanded
            : !collapsed || Boolean(hasActiveChild);
          return (
            <div key={item.href}>
              {item.collapsible ? (
                <button
                  type="button"
                  title={collapsed ? item.label : undefined}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedItems((current) => ({
                      ...current,
                      [item.href]: !isExpanded,
                    }))
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-start">
                        {item.label}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    isActive || hasActiveChild
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )}
              {item.children && (
                <div
                  aria-hidden={!showChildren}
                  inert={!showChildren}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none",
                    showChildren
                      ? "grid-rows-[1fr] opacity-100"
                      : "pointer-events-none grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div
                      className={cn(
                        "mt-1 flex flex-col gap-1 border-s border-border",
                        collapsed ? "items-center ps-1" : "ms-5 ps-2",
                      )}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = child.exact
                          ? pathname === child.href
                          : pathname === child.href ||
                            pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            aria-current={childActive ? "page" : undefined}
                            title={collapsed ? child.label : undefined}
                            className={cn(
                              "flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-medium transition-colors",
                              collapsed && "w-9 justify-center px-0",
                              childActive
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                            {!collapsed && (
                              <span className="truncate">{child.label}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
