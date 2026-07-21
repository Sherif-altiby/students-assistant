"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { useChat } from "@/hooks/useChat";
 

export default function ChatPage() {
  const chat = useChat();

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* <ChatHeader isConnected={chat.isConnected} /> */}

      <MessageList
        messages={chat.messages}
        isLoading={chat.isLoading}
        currentUserId={chat.currentUserId}
        onReact={chat.react}
        onReply={chat.setReplyTo}
        bottomRef={chat.bottomRef}
      />

      <MessageInput
        replyTo={chat.replyTo}
        onCancelReply={() => chat.setReplyTo(null)}
        onSend={chat.sendMessage}
        isSending={chat.isSending}
        disabled={!chat.isConnected}
      />
    </div>
  );
}