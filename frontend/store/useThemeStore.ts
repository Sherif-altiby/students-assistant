import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  resolved: boolean; // true once we've read localStorage/system preference
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = "theme";

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  resolved: false,

  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyThemeClass(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  initTheme: () => {
    const initial = getStoredTheme() ?? getSystemTheme();
    applyThemeClass(initial);
    set({ theme: initial, resolved: true });
  },
}));