// route.ts


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

    // Forward required request headers
    const headers = new Headers();

    for (const name of [
      "content-type",
      "accept",
      "cookie",
      "authorization",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }

    const hasBody = !["GET", "HEAD"].includes(request.method);

    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    // Forward response headers
    const responseHeaders = new Headers();

    for (const name of [
      "content-type",
      "cache-control",
      "www-authenticate",
      "retry-after",
      "location",
    ]) {
      const value = backendResponse.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    // Forward every Set-Cookie header separately
    const cookies = backendResponse.headers.getSetCookie();

    for (const cookie of cookies) {
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
