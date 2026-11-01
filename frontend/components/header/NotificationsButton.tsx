"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/study-table";

export function NotificationsButton() {
  const queryClient = useQueryClient();
  const unreadQuery = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000,
  });
  const listQuery = useQuery({
    queryKey: ["notifications", 1],
    queryFn: () => listNotifications(1, 20),
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] }),
    ]);
  };
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refresh,
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refresh,
  });
  const notifications = listQuery.data?.notifications ?? [];
  const unreadCount = unreadQuery.data ?? listQuery.data?.unreadCount ?? 0;

  return <Popover>
    <PopoverTrigger render={<Button size="icon" variant="ghost" aria-label="الإشعارات" className="relative">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>}
    </Button>} />
    <PopoverContent align="end" className="w-80 p-0" dir="rtl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">الإشعارات</h3>
        <Button size="sm" variant="ghost" disabled={!unreadCount || readAllMutation.isPending}
          onClick={() => readAllMutation.mutate()}>
          {readAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="ml-1 h-4 w-4" />}
          قراءة الكل
        </Button>
      </div>
      {listQuery.isError ? <p role="alert" className="p-5 text-center text-sm text-destructive">تعذر تحميل الإشعارات</p>
        : listQuery.isLoading ? <p className="p-5 text-center text-sm text-muted-foreground">جارٍ تحميل الإشعارات...</p>
          : notifications.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات</p>
            : <ul className="max-h-80 divide-y overflow-y-auto">
              {notifications.map((notification) => <li key={notification.id}>
                <button type="button" className={`w-full px-4 py-3 text-right hover:bg-accent ${notification.readAt ? "" : "bg-primary/5"}`}
                  disabled={Boolean(notification.readAt) || readMutation.isPending}
                  onClick={() => readMutation.mutate(notification.id)}>
                  <span className="block text-sm font-medium">{notification.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{notification.body}</span>
                  <time className="mt-1 block text-[10px] text-muted-foreground" dateTime={notification.createdAt}>
                    {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}
                  </time>
                </button>
              </li>)}
            </ul>}
    </PopoverContent>
  </Popover>;
}
