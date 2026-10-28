"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/store/useAuthStore";
import { Header } from "@/components/header/Header";
import { RoleGuard } from "@/components/auth/RoleGuard";

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

   

  return (
    <div className="flex h-screen bg-paper ">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto  custom-scrollbar">
        <Header />
        <div className=" ">
          {/* <RoleGuard allowedRoles={["USER"]}> */}
            {children}
            {/* </RoleGuard> */}
        </div>
      </main>
    </div>
  );
}
