"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationPages,
} from "@/components/ui/pagination";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/study-table";

const PAGE_SIZE = 20;
const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
const UNREAD_COUNT_QUERY_KEY = ["notifications-unread-count"] as const;

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isBootstrapping && !user) router.replace("/login");
  }, [isBootstrapping, user, router]);

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

  const notifications = notificationsQuery.data?.notifications ?? [];
  const pagination = notificationsQuery.data?.pagination;
  const unreadCount =
    unreadCountQuery.data ?? notificationsQuery.data?.unreadCount ?? 0;

  if (isBootstrapping || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">

        <Card className="gap-0 border border-border p-0 shadow-none ring-0">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-card-foreground">
                  جميع الإشعارات
                </h2>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} إشعار غير مقروء`
                    : "أنت على اطلاع بكل جديد"}
                </p>
              </div>
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

          {notificationsQuery.isLoading ? (
            <div className="space-y-3 p-4 sm:p-5" aria-label="جارٍ تحميل الإشعارات">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-muted/50"
                />
              ))}
            </div>
          ) : notificationsQuery.isError ? (
            <div
              role="alert"
              className="m-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive sm:m-5"
            >
              تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى.
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  لا توجد إشعارات
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  ستظهر هنا الإشعارات الجديدة عند وصولها.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const isMarkingRead =
                  markReadMutation.isPending &&
                  markReadMutation.variables === notification.id;

                return (
                  <li
                    key={notification.id}
                    className={`flex items-start gap-3 px-4 py-4 transition-colors sm:px-5 ${isUnread ? "bg-primary/[0.035]" : ""
                      }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"
                        }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            جديد
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {notification.body}
                      </p>
                      <time
                        className="mt-2 block text-xs text-muted-foreground"
                        dateTime={notification.createdAt}
                      >
                        {formatNotificationDate(notification.createdAt)}
                      </time>
                    </div>
                    {isUnread && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`تحديد "${notification.title}" كمقروء`}
                        title="تحديد كمقروء"
                        disabled={markReadMutation.isPending}
                        onClick={() =>
                          markReadMutation.mutate(notification.id)
                        }
                      >
                        {isMarkingRead ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-muted-foreground">
                صفحة {pagination.currentPage} من {pagination.totalPages}
              </p>
              <Pagination className="w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-label="الصفحة السابقة"
                      onClick={() =>
                        pagination.currentPage > 1 &&
                        setPage(pagination.currentPage - 1)
                      }
                      className={
                        pagination.currentPage <= 1
                          ? "pointer-events-none opacity-40"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPaginationPages(
                    pagination.currentPage,
                    pagination.totalPages,
                  ).map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        isActive={pageNumber === pagination.currentPage}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      aria-label="الصفحة التالية"
                      onClick={() =>
                        pagination.currentPage < pagination.totalPages &&
                        setPage(pagination.currentPage + 1)
                      }
                      className={
                        pagination.currentPage >= pagination.totalPages
                          ? "pointer-events-none opacity-40"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
