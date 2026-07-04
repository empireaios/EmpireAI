import { AUTH_UPSTREAM_TIMEOUT_MS, proxyBrainRequest } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return proxyBrainRequest("/auth/me", request, { upstreamTimeoutMs: AUTH_UPSTREAM_TIMEOUT_MS });
}
