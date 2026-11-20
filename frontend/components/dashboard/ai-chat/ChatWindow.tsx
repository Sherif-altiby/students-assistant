// src/components/chat/ChatWindow.tsx
"use client";

import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { ChatHeader } from "@/components/chat/ChatHeader";
import type { ChatSource } from "@/types/chat-source";

export function ChatWindow({ source }: { source: ChatSource }) {
  return (
    <div className="flex h-full flex-col overflow-hidden chat-background">
      <ChatHeader
        title={source.title}
        subtitle={source.subtitle}
        icon={source.headerIcon}
        isConnected={source.isConnected}
      />

      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={source.messages}
          isLoading={source.isLoading}
          currentUserId={source.currentUserId}
          showSender={source.kind === "group"}
          onReact={source.react}
          onReply={source.setReplyTo}
          bottomRef={source.bottomRef}
        />
      </div>

      {source.readOnly ? (
        <div className="border-t border-border bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          هذه المحادثة للقراءة فقط — لا يمكن إرسال رسائل جديدة.
        </div>
      ) : (
        <MessageInput
          replyTo={source.replyTo}
          onCancelReply={() => source.setReplyTo(null)}
          onSend={source.sendMessage}
          isSending={source.isSending}
          disabled={!source.isConnected}
        />
      )}
    </div>
  );
}