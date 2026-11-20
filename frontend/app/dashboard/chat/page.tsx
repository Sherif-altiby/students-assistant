// app/dashboard/chat/page.tsx
import { ChatPageBody } from "@/components/chat/ChatPageBody";
import { Suspense } from "react";
 
 
export const dynamic = "force-dynamic";

export default function UnifiedChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatPageBody />
    </Suspense>
  );
}

function ChatSkeleton() {
  return <div className="h-[calc(100vh-70px)] bg-background" />;
}