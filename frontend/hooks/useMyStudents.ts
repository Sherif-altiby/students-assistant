// hooks/useMyStudents.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export interface MyStudent {
  studentId: string;
  studentName: string;
  lastBookingAt: string;
  canSend: boolean;
  chatId: string;
}

export function useMyStudents() {
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ["doctors", "me", "students", userId],
    queryFn: async () => {
      const res = await api.get<{ data: MyStudent[] }>("support/doctors/me/students");
      return res.data.data;
    },
    enabled: Boolean(userId && role === "DOCTOR"),
  });
}