// app/dashboard/chat/ChatPageBody.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MessageCircle, Menu } from "lucide-react";
import { UnifiedChatSidebar } from "@/components/chat/UnifiedChatSidebar";
import { useGeneralChatSource } from "@/components/chat/useGeneralChatSource";
import { useDoctorChatSource } from "@/components/chat/useDoctorChatSource";
import { useAuthStore } from "@/store/useAuthStore";
import { ChatWindow } from "@/components/dashboard/ai-chat/ChatWindow";

export function ChatPageBody() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  const role = useAuthStore((s) => s.user?.role);
  const isDoctor = role === "DOCTOR";

  const chatParam = searchParams.get("chat");
  const activeId = isDoctor && chatParam === "general" ? null : chatParam;

  const isGeneral = !isDoctor && activeId === "general";
  const isDoctorChat = !!activeId && activeId !== "general";

  const generalSource = useGeneralChatSource(isGeneral);
  const doctorSource = useDoctorChatSource(isDoctorChat ? activeId! : "");

  const handleSelect = (id: string) => {
    router.push(
      id === "general"
        ? "/dashboard/chat?chat=general"
        : `chat?chat=${id}`,
    );
  };

  return (
    <div className="flex h-[calc(100vh-70px)] overflow-hidden">
      <UnifiedChatSidebar
        activeId={activeId ?? ""}
        onSelect={handleSelect}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
        {/* Mobile-only header bar with the menu trigger */}
        <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="فتح المحادثات"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-foreground">
            المحادثات
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          {isGeneral ? (
            <ChatWindow source={generalSource} />
          ) : isDoctorChat ? (
            <ChatWindow source={doctorSource} />
          ) : (
            <NoChatSelected isDoctor={isDoctor} />
          )}
        </div>
      </main>
    </div>
  );
}

function NoChatSelected({ isDoctor }: { isDoctor: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center mt-5 blcok">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <MessageCircle className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">لم تختر محادثة بعد</p>
        <p className="text-xs text-muted-foreground">
          {isDoctor
            ? "اختر طالباً من القائمة لبدء المحادثة."
            : "اختر غرفة الدراسة أو طبيباً من القائمة لبدء المحادثة."}
        </p>
      </div>
    </div>
  );
}