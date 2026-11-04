// RoleGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

type UserRole = "USER" | "ADMIN" | "DOCTOR" | "PARENT";

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
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isBootstrapping) return;
    if (!user) {
      setIsAuthorized(false);
      router.replace(redirectTo);
      return;
    }

    const userRole = user.role as UserRole;
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      const roleRoutes: Record<UserRole, string> = {
        USER: "/dashboard",
        ADMIN: "/admin",
        DOCTOR: "/doctor",
        PARENT: "/parent",
      };
      router.replace(roleRoutes[userRole] || "/dashboard");
    }
  }, [user, isBootstrapping, router, allowedRoles, redirectTo]);


  if (!isAuthorized) return null;

  return <>{children}</>;
}