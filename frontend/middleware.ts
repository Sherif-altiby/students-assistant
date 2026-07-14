import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * We can't read the in-memory access token here (middleware runs on the
 * edge, separate from the browser's React tree), but the backend's
 * httpOnly `refreshToken` cookie IS visible to server-side code even
 * though client JS can't touch it. Its mere presence is enough to gate
 * routes; the real validation still happens against the API on every
 * request via the access/refresh flow in lib/api.ts.
 *
 * NOTE: this only works if the frontend and API share a domain (or the
 * API is reverse-proxied under the same origin), since browsers only
 * attach a cookie to requests made to the domain that set it. If the API
 * is fully cross-origin, rely on the client-side guard in
 * app/dashboard/layout.tsx (via AuthProvider) as the source of truth.
 */
const PUBLIC_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  // const { pathname } = request.nextUrl;
  // const hasRefreshToken = request.cookies.has("refreshToken");

  // const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  // const isDashboardRoute = pathname.startsWith("/dashboard");

  // if (isDashboardRoute && !hasRefreshToken) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // if (isPublicRoute && hasRefreshToken) {
  //   return NextResponse.redirect(new URL("/dashboard", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
