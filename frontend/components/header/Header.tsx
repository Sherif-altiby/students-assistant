"use client";

import { NotificationsButton } from "./NotificationsButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className=" sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur-sm sm:px-10">
      <div />

      <div className="flex items-center gap-1">
        <NotificationsButton />
        <ThemeToggle />
        <div className="mx-2 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}