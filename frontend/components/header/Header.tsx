"use client";

import { NotificationsButton } from "./NotificationsButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "./UserMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";

export function Header({
  showNotifications = true,
}: {
  showNotifications?: boolean;
}) {
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  return (
    <header className=" sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur-sm sm:px-10">
      <div />

      <div className="flex items-center gap-1">
        {isBootstrapping ? (
          <div
            className="flex items-center gap-1"
            role="status"
            aria-label="جارٍ تحميل شريط التنقل"
            aria-busy="true"
          >
            {showNotifications && (
              <Skeleton aria-hidden="true" className="size-9 rounded-full" />
            )}
            <Skeleton aria-hidden="true" className="size-9 rounded-full" />
            <div className="mx-2 h-6 w-px bg-border" />
            <Skeleton aria-hidden="true" className="size-9 rounded-full" />
            <div className="hidden space-y-1 sm:block">
              <Skeleton aria-hidden="true" className="h-3 w-24" />
              <Skeleton aria-hidden="true" className="h-3 w-32" />
            </div>
          </div>
        ) : (
          <>
            {showNotifications && <NotificationsButton />}
            <ThemeToggle />
            <div className="mx-2 h-6 w-px bg-border" />
            <UserMenu />
          </>
        )}
      </div>
    </header>
  );
}
