"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsButtonProps {
  notifications?: NotificationItem[];
}

export function NotificationsButton({ notifications = [] }: NotificationsButtonProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger>
        <Button
          size="icon"
          variant="ghost"
          aria-label="الإشعارات"
          className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">الإشعارات</h3>
        </div>

        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            لا توجد إشعارات جديدة
          </p>
        ) : (
          <div className="max-h-80 divide-y divide-border overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-2 px-4 py-3 transition-colors hover:bg-accent",
                  !n.read && "bg-primary/5",
                )}
              >
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <div className={cn("min-w-0 flex-1", n.read && "pr-4")}>
                  <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.description}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}