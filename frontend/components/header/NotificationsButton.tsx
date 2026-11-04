"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUnreadNotificationCount } from "@/lib/study-table";
import { useAuthStore } from "@/store/useAuthStore";

export function NotificationsButton() {
  const user = useAuthStore((state) => state.user);
  const unreadQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });
  const unreadCount = unreadQuery.data ?? 0;

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={
        unreadCount > 0
          ? `الإشعارات، ${unreadCount} غير مقروءة`
          : "الإشعارات"
      }
      className={cn(
        buttonVariants({ size: "icon", variant: "ghost" }),
        "relative",
      )}
    >
      <Bell className="h-4 w-4" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
