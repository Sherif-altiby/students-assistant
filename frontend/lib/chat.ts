import { api } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";

interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface GetHistoryParams {
  cursor?: string;
  limit?: number;
}

export async function getChatHistory(
  params: GetHistoryParams = {},
): Promise<ChatMessage[]> {
  const res = await api.get<ApiEnvelope<ChatMessage[]>>("/chat/messages", {
    params: { cursor: params.cursor, limit: params.limit ?? 30 },
  });
  return res.data.data;
}