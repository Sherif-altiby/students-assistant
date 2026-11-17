export interface ChatReply {
  conversationId: string;
  operation: string;
  answer: string;
  citedPages: number[];
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citedPages?: number[];
}

export interface ChatReply {
  conversationId: string;
  operation: string;
  answer: string;
  citedPages: number[];
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citedPages?: number[];
  createdAt?: string | null;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string | null;
  archivedAt: string | null;
}