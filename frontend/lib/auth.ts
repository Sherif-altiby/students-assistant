
import { api, refreshAccessToken } from "@/lib/api";
import { authApi } from "@/lib/auth-api";

import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  User,
} from "@/types";

export async function login(payload: LoginPayload) {
  const res = await authApi.post<AuthResponse>("/login", payload);
  return res.data.data;
}

export async function register(payload: RegisterPayload) {
  const res = await authApi.post<AuthResponse>("/register", payload);
  return res.data.data;
}

export interface ParentRegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export async function registerParent(payload: ParentRegisterPayload) {
  const res = await authApi.post<AuthResponse>("/register-parent", payload);
  return res.data.data;
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<MeResponse>("/auth/me");
  return res.data.data;
}

export async function logout() {
  await authApi.post("/logout");
}

/**
 * Called once on app load.
 * The refreshToken httpOnly cookie is sent through the Next.js proxy.
 */
export async function restoreSession(): Promise<{
  accessToken: string;
  user: User;
} | null> {
  try {
    const accessToken = await refreshAccessToken();
    const user = await fetchMe();

    return { accessToken, user };
  } catch {
    return null;
  }
}
