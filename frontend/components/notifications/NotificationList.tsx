"use client";

import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import type { NotificationItem } from "@/types/study-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NotificationListProps {
  notifications: NotificationItem[];
  isLoading: boolean;
  isError: boolean;
  markingReadId: string | null;
  deletingId: string | null;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function NotificationList({
  notifications,
  isLoading,
  isError,
  markingReadId,
  deletingId,
  onMarkRead,
  onDelete,
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5" aria-label="جارٍ تحميل الإشعارات">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="m-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive sm:m-5"
      >
        تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى.
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Bell className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">لا توجد إشعارات</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            ستظهر هنا الإشعارات الجديدة عند وصولها.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {notifications.map((notification) => {
        const isUnread = !notification.readAt;
        const isMarkingRead = markingReadId === notification.id;
        const isDeleting = deletingId === notification.id;
        const isBusy = markingReadId !== null || deletingId !== null;

        return (
          <li
            key={notification.id}
            className={`flex items-start gap-3 px-4 py-4 transition-colors sm:px-5 ${
              isUnread ? "bg-primary/[0.035]" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                isUnread ? "bg-primary" : "bg-transparent"
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
            <div className="flex shrink-0 items-center gap-1">
              {isUnread && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`تحديد "${notification.title}" كمقروء`}
                  title="تحديد كمقروء"
                  disabled={isBusy}
                  onClick={() => onMarkRead(notification.id)}
                >
                  {isMarkingRead ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`حذف إشعار "${notification.title}"`}
                      title="حذف الإشعار"
                      disabled={isBusy}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    />
                  }
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  )}
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف الإشعار؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف هذا الإشعار نهائيًا. لا يمكن التراجع عن هذا
                      الإجراء.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => onDelete(notification.id)}
                    >
                      حذف الإشعار
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
