// components/auth/RoleGuard.tsx
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
  redirectTo = "/login" 
}: RoleGuardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // If still loading, wait

    // If no user, redirect to login
    if (!user) {
      router.push(redirectTo);
      return;
    }

    // Check if user's role is allowed
    const userRole = user.role as UserRole;
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
    } else {
      // Redirect to user's appropriate dashboard
      const roleRoutes = {
        USER: "/dashboard",
        ADMIN: "/admin",
        DOCTOR: "/doctor",
      };
      router.push(roleRoutes[userRole] || "/dashboard");
    }
  }, [user, router, allowedRoles, redirectTo]);

 

  // If not authorized, don't render children
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}