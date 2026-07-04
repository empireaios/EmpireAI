import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCockpitRedirectForPlatformPath } from "@/lib/platform/cockpit-redirects";

const SEARCH_ENGINE_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, nocache",
} as const;

function withSearchEngineProtection(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SEARCH_ENGINE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function isProtectedAppRoute(pathname: string) {
  return pathname.startsWith("/platform") || pathname.startsWith("/cockpit");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("empireai_session");

  const cockpitRedirect = getCockpitRedirectForPlatformPath(pathname);
  if (cockpitRedirect) {
    return withSearchEngineProtection(
      NextResponse.redirect(new URL(cockpitRedirect, request.url), 308),
    );
  }

  if (pathname === "/") {
    const target = session ? "/cockpit" : "/login";
    return withSearchEngineProtection(NextResponse.redirect(new URL(target, request.url)));
  }

  if (!isProtectedAppRoute(pathname)) {
    return withSearchEngineProtection(NextResponse.next());
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withSearchEngineProtection(NextResponse.redirect(loginUrl));
  }

  return withSearchEngineProtection(NextResponse.next());
}

export const config = {
  matcher: ["/", "/login", "/platform", "/platform/:path*", "/cockpit", "/cockpit/:path*"],
};
