import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
  setBootstrapping: (value: boolean) => void;
}

/**
 * The access token deliberately lives only in memory (never localStorage)
 * to reduce XSS exposure. The refreshToken is an httpOnly cookie set by the
 * backend, so on a hard page reload we lose `accessToken` here but the
 * cookie survives — see AuthProvider, which calls /auth/refresh on mount to
 * silently restore the session.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isBootstrapping: true,
  setSession: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ user: null, accessToken: null }),
  setBootstrapping: (value) => set({ isBootstrapping: value }),
}));
