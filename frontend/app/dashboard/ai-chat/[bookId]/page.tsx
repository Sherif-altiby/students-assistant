"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Bot } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChatWindow } from "@/components/dashboard/ai-chat/ChatWindow";
import { CreateQuizCard } from "@/components/dashboard/quiz/CreateQuizCard";
export default function BookChatPage() {
  const { bookId } = useParams<{ bookId: string }>();

  return (
    <div className="mx-auto w-full space-y-4 p-4">
      <PageHeader
        title="محادثة مع كتابك"
        description="اسأل عن أي جزء في الكتاب، والإجابة بتيجي من الكتاب نفسه مع رقم الصفحة."
        icon={<Bot className="h-5 w-5" />}
        action={
          <Link
            href="/dashboard/ai-chat"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            رفع كتاب آخر
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <ChatWindow key={bookId} bookId={bookId} />
      <CreateQuizCard bookId={bookId} />
    </div>
  );
}