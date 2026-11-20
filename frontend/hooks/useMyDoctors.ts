// hooks/useMyDoctors.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

// types/chat-sidebar.ts
export interface MyDoctor {
  doctorId: string;
  doctorName: string;
  lastBookingAt: string;
  canSend: boolean;
  chatId: string;
}

export interface MyStudent {
  studentId: string;
  studentName: string;
  lastBookingAt: string;
  canSend: boolean;
  chatId: string;
}

export function useMyDoctors() {
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["users", "me", "doctors", userId],
    queryFn: async () => {
      const res = await api.get<{ data: MyDoctor[] }>("support/users/me/doctors");
      return res.data.data;
    },
    enabled: Boolean(userId && role === "USER"),
  });
}