import { api } from "@/lib/api";
import type { ParentLinkRequest, ParentOverview, ParentStudentLink } from "@/types/parent";

interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export async function listParentStudents() {
  const response = await api.get<ApiEnvelope<ParentStudentLink[]>>(
    "/parent/students",
  );
  return response.data.data;
}

export async function requestStudentAccess(studentEmail: string) {
  const response = await api.post<ApiEnvelope<{ id: string; status: string }>>(
    "/parent/students/requests",
    { studentEmail },
  );
  return response.data.data;
}

export async function getParentStudentOverview(studentId: string) {
  const response = await api.get<ApiEnvelope<ParentOverview>>(
    `/parent/students/${studentId}/overview`,
  );
  return response.data.data;
}

export async function listParentLinkRequests() {
  const response = await api.get<ApiEnvelope<ParentLinkRequest[]>>(
    "/parent-links/requests",
  );
  return response.data.data;
}

export async function respondToParentLinkRequest(
  id: string,
  decision: "approve" | "reject",
) {
  const response = await api.post<ApiEnvelope<{ approved: boolean }>>(
    `/parent-links/${id}/${decision}`,
  );
  return response.data.data;
}
