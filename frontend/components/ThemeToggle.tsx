"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/useThemeStore";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      aria-label={isDark ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
      className="h-9 w-9 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}