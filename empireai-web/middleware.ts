import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isProtectedAppRoute(pathname: string) {
  return pathname.startsWith("/platform") || pathname.startsWith("/cockpit");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/platform/:path*", "/cockpit/:path*"],
};
