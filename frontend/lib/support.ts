import { api } from "@/lib/api";
import type { ConsultationSession, SupportSession } from "@/types";

interface ListResponse<T> { status: "success"; data: T[] }
interface ItemResponse<T> { status: "success"; data: T }

// NOTE: /support and /consultation endpoints were not part of the provided
// spec. Implemented as simple booking resources; adjust paths/shape once
// the real backend contract is confirmed.
export async function listSupportSessions(): Promise<SupportSession[]> {
  const res = await api.get<ListResponse<SupportSession>>("/support");
  return res.data.data;
}

export async function requestSupportSession(note?: string): Promise<SupportSession> {
  const res = await api.post<ItemResponse<SupportSession>>("/support", { note });
  return res.data.data;
}

export async function listConsultations(): Promise<ConsultationSession[]> {
  const res = await api.get<ListResponse<ConsultationSession>>("/consultation");
  return res.data.data;
}

export async function requestConsultation(subject?: string): Promise<ConsultationSession> {
  const res = await api.post<ItemResponse<ConsultationSession>>("/consultation", { subject });
  return res.data.data;
}

/** A session counts against this month's quota if created in the current calendar month. */
export function countThisMonth(items: { createdAt: string }[]): number {
  const now = new Date();
  return items.filter((item) => {
    const d = new Date(item.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

export const SUPPORT_MONTHLY_LIMIT = 1;
export const CONSULTATION_MONTHLY_LIMIT = 3;
