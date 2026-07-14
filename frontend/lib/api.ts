import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { RefreshResponse } from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Main API client used by every feature (auth, tasks, habits, support...).
 * `withCredentials: true` makes the browser send the httpOnly `refreshToken`
 * cookie automatically on every request, including /auth/refresh.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

// A separate, interceptor-free client for the refresh call itself,
// so a failed refresh never recursively triggers another refresh.
const refreshClient = axios.create({ baseURL, withCredentials: true });

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // De-duplicate concurrent 401s: only one /auth/refresh call in flight.
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<RefreshResponse>("/auth/refresh")
      .then((res) => {
        const token = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
    const isAuthCall =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall &&
      !isAuthCall
    ) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers.set("Authorization", `Bearer ${token}`);
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearSession();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { refreshAccessToken };
