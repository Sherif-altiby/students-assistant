
import { NextRequest } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxy(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  try {
    const backendBaseUrl = process.env.API_URL;

    if (!backendBaseUrl) {
      console.error("[Auth Proxy] API_URL is missing");

      return Response.json(
        {
          status: "error",
          message: "API_URL is not configured",
        },
        { status: 500 }
      );
    }

    const { path } = await context.params;

    const backendUrl = new URL(
      `auth/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      `${backendBaseUrl.replace(/\/+$/, "")}/`
    );

    // Read the incoming browser cookie.
    const cookieHeader = request.headers.get("cookie");

    // Debug without exposing actual cookie values.
    const cookieNames =
      cookieHeader
        ?.split(";")
        .map((cookie) => cookie.trim().split("=")[0])
        .filter(Boolean) ?? [];

    console.log("[Auth Proxy] Method:", request.method);
    console.log("[Auth Proxy] Backend URL:", backendUrl.toString());
    console.log("[Auth Proxy] Incoming cookie names:", cookieNames);
    console.log(
      "[Auth Proxy] Refresh token received:",
      cookieNames.includes("refreshToken")
    );

    // Forward request headers to Express.
    const headers = new Headers();

    for (const name of [
      "content-type",
      "accept",
      "authorization",
    ]) {
      const value = request.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    // Forward the refresh cookie to Express.
    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    const hasBody = !["GET", "HEAD"].includes(request.method);

    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    console.log(
      "[Auth Proxy] Backend status:",
      backendResponse.status
    );

    // Prepare response headers.
    const responseHeaders = new Headers();

    for (const name of [
      "content-type",
      "cache-control",
      "www-authenticate",
      "retry-after",
      "location",
    ]) {
      const value = backendResponse.headers.get(name);

      if (value) {
        responseHeaders.set(name, value);
      }
    }

    // Forward Set-Cookie headers separately.
    const cookies = backendResponse.headers.getSetCookie();

    console.log(
      "[Auth Proxy] Backend Set-Cookie count:",
      cookies.length
    );

    for (const cookie of cookies) {
      console.log(
        "[Auth Proxy] Forwarding refresh cookie:",
        cookie.startsWith("refreshToken=") ||
          cookie.includes("refreshToken=")
      );

      responseHeaders.append("Set-Cookie", cookie);
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Auth Proxy Error]:", error);

    return Response.json(
      {
        status: "error",
        message: "Authentication proxy failed",
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
