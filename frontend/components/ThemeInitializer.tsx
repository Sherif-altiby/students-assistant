"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeInitializer({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme);
  const resolved = useThemeStore((s) => s.resolved);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div style={{ visibility: resolved ? "visible" : "hidden" }}>
      {children}
    </div>
  );
}