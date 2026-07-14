"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);

  useEffect(() => {
    if (!isBootstrapping && !user) {
      router.replace("/login");
    }
  }, [isBootstrapping, user, router]);

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="fixed top-0 right-0 h-screen w-64">
        <Sidebar />
      </div>
      <main className="flex-1 mr-64 h-screen overflow-y-auto px-6 py-8 sm:px-10">
        {children}
      </main>
    </div>
  );
}
