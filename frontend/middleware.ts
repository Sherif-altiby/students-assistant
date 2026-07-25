// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

type UserRole = "USER" | "ADMIN" | "DOCTOR";

interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

const ROLE_HOME: Record<UserRole, string> = {
  USER: "/dashboard",
  ADMIN: "/admin",
  DOCTOR: "/doctor",
};

const PATH_ROLE: Record<string, UserRole> = {
  "/dashboard": "USER",
  "/admin": "ADMIN",
  "/doctor": "DOCTOR",
};

const PUBLIC_ROUTES = ["/login", "/register", "/accept-invitation"];

function decodeRole(token: string): UserRole | null {
  try {
    const decoded = jwtDecode<RefreshTokenPayload>(token);
    const expired = decoded.exp * 1000 < Date.now();
    console.log("[middleware] decoded refreshToken:", {
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString(),
      expired,
    });
    if (expired) return null;
    return decoded.role ?? null;
  } catch (err) {
    console.log("[middleware] failed to decode refreshToken:", err);
    return null;
  }
}

function ownerRoleOf(pathname: string): UserRole | null {
  const prefix = Object.keys(PATH_ROLE).find((p) => pathname.startsWith(p));
  return prefix ? PATH_ROLE[prefix] : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const routeOwnerRole = ownerRoleOf(pathname);
  const isProtectedRoute = routeOwnerRole !== null;

  const refreshToken = request.cookies.get("refreshToken")?.value;

  console.log("[middleware] ----- incoming request -----");
  console.log("[middleware] pathname:", pathname);
  console.log("[middleware] all cookies:", request.cookies.getAll().map((c) => c.name));
  console.log("[middleware] refreshToken present:", !!refreshToken);

  const role = refreshToken ? decodeRole(refreshToken) : null;
  console.log("[middleware] resolved role:", role);
  console.log("[middleware] routeOwnerRole:", routeOwnerRole, "| isProtectedRoute:", isProtectedRoute);

  if (isPublicRoute && role) {
    console.log("[middleware] -> logged in on public route, redirecting to", ROLE_HOME[role]);
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  if (!isProtectedRoute) {
    console.log("[middleware] -> not a protected route, passing through");
    return NextResponse.next();
  }

  if (!role) {
    console.log("[middleware] -> no valid role/session, redirecting to /login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (routeOwnerRole !== role) {
    console.log(
      `[middleware] -> role mismatch (user is ${role}, route is for ${routeOwnerRole}), redirecting to ${ROLE_HOME[role]}`
    );
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  console.log("[middleware] -> access granted");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/login",
    "/register",
    "/accept-invitation",
  ],
};