import { DISPATCH_UPSTREAM_TIMEOUT_MS, proxyBrainRequest } from "@/lib/brain/server-proxy";
import { brainRouteConfig } from "@/lib/brain/route-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBrainRequest("/brain/dispatch", request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    upstreamTimeoutMs: DISPATCH_UPSTREAM_TIMEOUT_MS,
  });
}
