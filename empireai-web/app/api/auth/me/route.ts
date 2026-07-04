import {
  AUTH_UPSTREAM_TIMEOUT_MS,
  proxyBrainRequest,
  withClearedSessionCookie,
} from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const response = await proxyBrainRequest("/auth/me", request, {
    upstreamTimeoutMs: AUTH_UPSTREAM_TIMEOUT_MS,
  });
  if (response.status === 401) {
    return withClearedSessionCookie(response);
  }
  return response;
}
