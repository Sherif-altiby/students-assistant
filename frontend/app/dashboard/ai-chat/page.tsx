"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { BookUploadCard } from "@/components/dashboard/ai-chat/BookUploadCard";
import { BookList } from "@/components/dashboard/ai-chat/BookList";
import { BookOpen } from "lucide-react";

export default function AiChatPage() {
  return (
    <div className="mx-auto w-full space-y-6 p-4">
      <PageHeader
        title="كتبي الدراسية"
        description="ارفع كتبك بصيغة PDF، وبعدها اسأل عن أي جزء فيها أو اطلب تلخيصًا أو شرح صفحة معينة."
        icon={<BookOpen className="h-5 w-5" />}
      />

      <BookUploadCard />
      <BookList />
    </div>
  );
}