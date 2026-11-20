// components/Sidebar.tsx  (or wherever this file lives)
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
  Library,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { logout } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

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
  { href: "/dashboard/ai-chat", label: "كتبي", icon: Library },
  { href: "/dashboard/quizzes", label: "الكويزات", icon: ClipboardList },
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
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const showSkeleton = !mounted || isBootstrapping;

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
        "group relative flex h-screen flex-col border-l border-border bg-card transition-[width] duration-300 ease-in-out",
        showSkeleton ? "w-20 px-2" : collapsed ? "w-20 px-2" : "w-64 px-4",
      )}
      aria-busy={showSkeleton}
    >
      {/* ── Header: toggle + brand ─────────────────────────────────── */}
      <div
        className={cn(
          "relative flex items-center gap-3 pt-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {/* Brand — hidden entirely when collapsed */}
        {!collapsed && (
          <div className="flex min-w-0 items-center gap-3 px-1">
            {showSkeleton ? (
              <Skeleton className="size-10 shrink-0 rounded-xl" />
            ) : (
              <Image
                src="/logo.png"
                alt="مُذاكرة"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-xl object-contain"
                priority
              />
            )}

            {showSkeleton ? (
              <Skeleton className="h-5 w-28" />
            ) : (
              <span className="min-w-0 truncate font-display text-lg font-extrabold leading-tight text-primary">
                {title}
              </span>
            )}
          </div>
        )}

        {/* Toggle button */}
        {showSkeleton ? (
          <Skeleton className="size-10 rounded-full" />
        ) : (
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "توسيع القائمة" : "طي القائمة"}
            aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" />
            ) : (
              <PanelLeftClose className="h-[18px] w-[18px]" />
            )}
          </button>
        )}
      </div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "mt-4 h-px bg-border/60 transition-opacity",
          collapsed ? "mx-1" : "mx-0",
        )}
      />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav
        className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={showSkeleton ? "جارٍ تحميل القائمة" : undefined}
      >
        {showSkeleton
          ? items.map((item) => (
              <div
                key={item.href}
                aria-hidden
                className="flex h-10 items-center justify-center gap-3 rounded-xl px-0 md:justify-start md:px-3"
              >
                <Skeleton className="size-5 shrink-0 rounded-md" />
                {!collapsed && <Skeleton className="h-4 w-28" />}
              </div>
            ))
          : items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
              const hasActiveChild = item.children?.some((child) =>
                child.exact
                  ? pathname === child.href
                  : pathname === child.href ||
                    pathname.startsWith(`${child.href}/`),
              );
              const isExpanded =
                expandedItems[item.href] ?? hasActiveChild ?? false;
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
                        "group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-start">
                            {item.label}
                          </span>
                          <ChevronDown
                            aria-hidden
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
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group/item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        collapsed && "justify-center px-0",
                        isActive || hasActiveChild
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {/* Active accent dot on the collapsed rail */}
                      {collapsed && (isActive || hasActiveChild) && (
                        <span className="absolute -left-0.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                      )}
                    </Link>
                  )}

                  {/* Nested children */}
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

      {/* ── Footer: user + logout ───────────────────────────────────── */}
      <div
        className={cn(
          "mt-2 border-t border-border/60 pt-3",
          collapsed ? "flex flex-col items-center gap-2" : "space-y-2",
        )}
      >
        {showSkeleton ? (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2",
              collapsed && "justify-center",
            )}
          >
            <Skeleton className="size-9 rounded-full" />
            {!collapsed && (
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            )}
          </div>
        ) : (
          user && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-2",
                collapsed ? "justify-center" : "",
              )}
              title={collapsed ? user.name : undefined}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {user.name?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          )
        )}

        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}