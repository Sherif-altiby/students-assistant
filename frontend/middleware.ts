
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

type UserRole = "USER" | "ADMIN" | "DOCTOR" | "PARENT";

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
  PARENT: "/parent",
};

const PATH_ROLE: Record<string, UserRole> = {
  "/dashboard": "USER",
  "/admin": "ADMIN",
  "/doctor": "DOCTOR",
  "/parent": "PARENT",
};

const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/accept-invitation",
];

const VALID_ROLES: UserRole[] = [
  "USER",
  "ADMIN",
  "DOCTOR",
  "PARENT",
];

function decodeRole(token: string): UserRole | null {
  try {
    const decoded = jwtDecode<RefreshTokenPayload>(token);

    console.log("[middleware] JWT details:", {
      role: decoded.role,
      exp: decoded.exp,
      hasExpiration: typeof decoded.exp === "number",
      isExpired:
        typeof decoded.exp === "number"
          ? decoded.exp * 1000 <= Date.now()
          : true,
    });

    if (
      !decoded.exp ||
      decoded.exp * 1000 <= Date.now()
    ) {
      console.log("[middleware] Invalid or expired token");
      return null;
    }

    if (!VALID_ROLES.includes(decoded.role)) {
      console.log("[middleware] Invalid role:", decoded.role);
      return null;
    }

    return decoded.role;
  } catch (error) {
    console.error("[middleware] JWT decoding failed:", error);
    return null;
  }
}

function ownerRoleOf(pathname: string): UserRole | null {
  const prefix = Object.keys(PATH_ROLE).find(
    (path) =>
      pathname === path || pathname.startsWith(`${path}/`)
  );

  return prefix ? PATH_ROLE[prefix] : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  const routeOwnerRole = ownerRoleOf(pathname);
  const isProtectedRoute = routeOwnerRole !== null;

  const refreshToken =
    request.cookies.get("refreshToken")?.value;

  console.log("[middleware] ----- incoming request -----");
  console.log("[middleware] pathname:", pathname);
  console.log(
    "[middleware] cookie names:",
    request.cookies.getAll().map((cookie) => cookie.name)
  );
  console.log(
    "[middleware] refreshToken present:",
    Boolean(refreshToken)
  );

  const role = refreshToken ? decodeRole(refreshToken) : null;

  console.log("[middleware] resolved role:", role);
  console.log("[middleware] expected role:", routeOwnerRole);

  if (isPublicRoute && role) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role], request.url)
    );
  }

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    console.log("[middleware] Redirecting to login");

    return NextResponse.redirect(loginUrl);
  }

  if (routeOwnerRole !== role) {
    return NextResponse.redirect(
      new URL(ROLE_HOME[role], request.url)
    );
  }

  console.log("[middleware] Access granted");

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/parent/:path*",
    "/register/:path*",
    "/login",
    "/accept-invitation",
  ],
};
