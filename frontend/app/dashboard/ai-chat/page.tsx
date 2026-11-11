"use client";

import { Bot } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookUploadCard } from "@/components/dashboard/ai-chat/BookUploadCard";

export default function AiChatPage() {
  return (
    <div className="mx-auto w-full space-y-6 p-4">
      <PageHeader
        title="الدردشة مع الذكاء الاصطناعي"
        description="ارفع كتابك واسأل عنه، أو اطلب تلخيص جزء أو شرح صفحة."
        icon={<Bot className="h-5 w-5" />}
      />

      <BookUploadCard />
    </div>
  );
}