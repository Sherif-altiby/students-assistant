import { api } from "@/lib/api";
import type { AdminRole } from "@/types/admin";
import type { User } from "@/types";

export type { AdminRole } from "@/types/admin";

export interface AdminUser extends User {
  status: "ACTIVE" | "PENDING";
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export async function listAdminUsers(params: {
  page: number;
  limit: number;
  search: string;
  role: AdminRole;
}) {
  const response = await api.get<ApiEnvelope<PaginatedUsers>>("/users", {
    params: {
      ...params,
      role: params.role === "ALL" ? undefined : params.role,
    },
  });
  return response.data.data;
}

export async function inviteDoctor(payload: {
  name: string;
  email: string;
  phone: string;
}) {
  const response = await api.post<
    ApiEnvelope<Pick<AdminUser, "id" | "email" | "status">>
  >("/users/doctors/invite", payload);
  return response.data.data;
}

export async function deleteDoctor(id: string) {
  await api.delete(`/users/doctors/${id}`);
}
