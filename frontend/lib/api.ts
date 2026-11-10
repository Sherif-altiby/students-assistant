
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/useAuthStore";
import type { RefreshResponse } from "@/types";
import { authApi } from "@/lib/auth-api";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Main API client for normal application requests.
 * Keeps your existing accessToken Authorization behavior.
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

/**
 * Refresh through the Next.js same-origin proxy.
 * Do not use the backend URL directly here.
 */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = authApi
      .post<RefreshResponse>("/refresh")
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
    const originalRequest =
      error.config as RetryableConfig | undefined;

    const status = error.response?.status;

    const isRefreshCall =
      originalRequest?.url?.includes("/auth/refresh");

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

        originalRequest.headers.set(
          "Authorization",
          `Bearer ${token}`
        );

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
