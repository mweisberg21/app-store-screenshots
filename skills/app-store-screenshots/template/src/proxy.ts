import { NextRequest, NextResponse } from "next/server";
import { accessError, UNLOCK_HTML } from "./lib/local-access";

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const bootstrap = pathname === "/unlock" || pathname === "/api/session";
  const error = accessError(req, !bootstrap);
  if (error) {
    if (error.status === 401 && req.method === "GET" && pathname === "/") {
      return NextResponse.redirect(new URL("/unlock", req.url));
    }
    return error;
  }
  if (pathname === "/unlock") {
    if (req.method !== "GET") return new Response(null, { status: 405 });
    return new Response(UNLOCK_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" } });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

// Include private static assets and Next routes, not only the two file APIs.
export const config = { matcher: "/:path*" };
