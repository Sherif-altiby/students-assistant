// RoleGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

type UserRole = "USER" | "ADMIN" | "DOCTOR";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles = ["USER", "ADMIN", "DOCTOR"],
  redirectTo = "/login",
}: RoleGuardProps) {
  const router = useRouter();
  const { user, } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Wait until the store has finished hydrating/loading before deciding anything

    if (!user) {
      router.replace(redirectTo);
      return;
    }

    const userRole = user.role as UserRole;
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      const roleRoutes: Record<UserRole, string> = {
        USER: "/dashboard",
        ADMIN: "/admin",
        DOCTOR: "/doctor",
      };
      router.replace(roleRoutes[userRole] || "/dashboard");
    }
  }, [user, router, allowedRoles, redirectTo]);


  if (!isAuthorized) return null;

  return <>{children}</>;
}