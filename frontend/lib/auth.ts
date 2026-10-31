import { api, refreshAccessToken } from "@/lib/api";
import type {
  AuthResponse,
  LoginPayload,
  MeResponse,
  RegisterPayload,
  User,
} from "@/types";

export async function login(payload: LoginPayload) {
  const res = await api.post<AuthResponse>("/auth/login", payload);
  return res.data.data;
}

export async function register(payload: RegisterPayload) {
  const res = await api.post<AuthResponse>("/auth/register", payload);
  return res.data.data;
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<MeResponse>("/auth/me");
  return res.data.data;
}

export async function logout() {
  await api.post("/auth/logout");
}

/**
 * Called once on app load. The refreshToken httpOnly cookie (if present and
 * valid) lets us mint a fresh access token and re-hydrate the user without
 * asking them to log in again.
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
