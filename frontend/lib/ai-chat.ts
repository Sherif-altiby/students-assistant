import { api } from "@/lib/api";
import type {
  ChatMessage,
  ChatReply,
  ConversationSummary,
} from "@/types/ai-chat";

// Accepts [..] or { <key>: [..] } so a small change in the API shape does not break the page
function unwrapList(body: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    for (const key of keys) {
      const value = (body as Record<string, unknown>)[key];
      if (Array.isArray(value)) return value;
    }
  }
  return [];
}

export async function sendChatMessage(
  bookId: string,
  payload: {
    message: string;
    conversationId?: string;
    newConversation?: boolean;
  },
): Promise<ChatReply> {
  // Summaries of big books can take a while, so allow a longer timeout
  const res = await api.post(`/books/${bookId}/chat`, payload, {
    timeout: 3 * 60 * 1000,
  });
  const body = res.data?.data ?? res.data;

  return {
    conversationId: body.conversationId,
    operation: body.operation,
    answer: body.answer,
    citedPages: body.citedPages ?? [],
  };
}

// Newest first
export async function listConversations(
  bookId: string,
): Promise<ConversationSummary[]> {
  const res = await api.get(`/books/${bookId}/conversations`);
  const body = res.data?.data ?? res.data;
  const rows = unwrapList(body, ["conversations", "items", "rows"]);

  return rows
    .map((c) => ({
      id: c.id as string,
      title: (c.title as string | null | undefined) ?? null,
      updatedAt: (c.updatedAt as string | null | undefined) ?? null,
      archivedAt: (c.archivedAt as string | null | undefined) ?? null,
    }))
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

// Oldest first, so the chat reads top to bottom
export async function getConversationMessages(
  bookId: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  const res = await api.get(
    `/books/${bookId}/conversations/${conversationId}/messages`,
  );
  const body = res.data?.data ?? res.data;
  const rows = unwrapList(body, ["messages", "items", "rows"]);

  return rows
    .map((m) => ({
      id: m.id as string,
      role: m.role as "USER" | "ASSISTANT",
      content: (m.content as string | undefined) ?? "",
      citedPages: (m.citedPages as number[] | undefined) ?? [],
      createdAt: (m.createdAt as string | null | undefined) ?? null,
    }))
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}