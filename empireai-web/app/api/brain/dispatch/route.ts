import { proxyBrainRequest } from "@/lib/brain/server-proxy";
import { brainRouteConfig } from "@/lib/brain/route-config";

export const runtime = brainRouteConfig.runtime;
export const dynamic = brainRouteConfig.dynamic;
export const maxDuration = brainRouteConfig.maxDuration;

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBrainRequest("/brain/dispatch", request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
