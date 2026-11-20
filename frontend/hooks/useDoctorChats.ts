// src/hooks/useDoctorChats.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { listDoctorChats } from "@/lib/doctor-chat";
import type { DoctorChatListItem } from "@/types/doctor-chat";

export function useDoctorChats() {
  const userId = useAuthStore((s) => s.user?.id);
  const role = useAuthStore((s) => s.user?.role);

  const query = useQuery({
    queryKey: ["doctor-chats", userId, role],
    queryFn: listDoctorChats,
    enabled: Boolean(userId && role),
  });

  return {
    chats: (query.data ?? []) as DoctorChatListItem[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
} 