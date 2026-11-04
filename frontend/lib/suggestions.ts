import { api } from "@/lib/api";

export interface Suggestion {
  id: string;
  message: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: "USER" | "PARENT" | "DOCTOR" | "ADMIN";
  } | null;
}

interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface PaginatedSuggestions {
  suggestions: Suggestion[];
  total: number;
  page: number;
  limit: number;
}

export async function submitSuggestion(message: string) {
  const response = await api.post<ApiEnvelope<Suggestion>>("/suggestions", {
    message,
  });
  return response.data.data;
}

export async function listSuggestions(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const response = await api.get<ApiEnvelope<PaginatedSuggestions>>(
    "/suggestions",
    { params },
  );
  return response.data.data;
}
