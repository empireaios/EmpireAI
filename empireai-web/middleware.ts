import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCockpitRedirectForPlatformPath } from "@/lib/platform/cockpit-redirects";

function isProtectedAppRoute(pathname: string) {
  return pathname.startsWith("/platform") || pathname.startsWith("/cockpit");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cockpitRedirect = getCockpitRedirectForPlatformPath(pathname);
  if (cockpitRedirect) {
    return NextResponse.redirect(new URL(cockpitRedirect, request.url), 308);
  }

  if (!isProtectedAppRoute(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("empireai_session");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/platform", "/platform/:path*", "/cockpit", "/cockpit/:path*"],
};
