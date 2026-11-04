"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationList } from "@/components/notifications/NotificationList";
import { NotificationPagination } from "@/components/notifications/NotificationPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  deleteNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/study-table";

const PAGE_SIZE = 20;
const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
const UNREAD_COUNT_QUERY_KEY = ["notifications-unread-count"] as const;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const [page, setPage] = useState(1);

  const notificationsQuery = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, page, PAGE_SIZE],
    queryFn: () => listNotifications(page, PAGE_SIZE),
    enabled: Boolean(user) && !isBootstrapping,
  });
  const unreadCountQuery = useQuery({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user) && !isBootstrapping,
    refetchInterval: 60_000,
  });

  async function refreshNotifications() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY }),
    ]);
  }

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshNotifications,
    onError: () => toast.error("تعذر تحديث حالة الإشعار"),
  });
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refreshNotifications,
    onError: () => toast.error("تعذر تحديد الإشعارات كمقروءة"),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      toast.success("تم حذف الإشعار");
      if (notifications.length === 1 && page > 1)
        setPage((current) => current - 1);
      await refreshNotifications();
    },
    onError: () => toast.error("تعذر حذف الإشعار"),
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const pagination = notificationsQuery.data?.pagination;
  const unreadCount =
    unreadCountQuery.data ?? notificationsQuery.data?.unreadCount ?? 0;
  const isMarkingRead = markReadMutation.isPending
    ? markReadMutation.variables
    : null;
  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null;

  return (
    <div dir="rtl" className="flex flex-col gap-6 p-4">
      <PageHeader
        title="الإشعارات"
        description="تابع آخر التحديثات والتنبيهات الخاصة بك."
        icon={<Bell className="h-7 w-7 text-primary" />}
      />

      <Card className="gap-0 border border-border bg-card p-0 shadow-none ring-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-card-foreground">
              جميع الإشعارات
            </h2>
            <Badge variant="secondary">{unreadCount} غير مقروءة</Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              unreadCount === 0 ||
              markAllReadMutation.isPending ||
              notificationsQuery.isLoading
            }
            onClick={() => markAllReadMutation.mutate()}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            )}
            قراءة الكل
          </Button>
        </div>

        <NotificationList
          notifications={notifications}
          isLoading={isBootstrapping || notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          markingReadId={isMarkingRead}
          deletingId={deletingId}
          onMarkRead={(id) => markReadMutation.mutate(id)}
          onDelete={(id) => deleteMutation.mutate(id)}
        />

        {pagination && (
          <NotificationPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>
    </div>
  );
}
