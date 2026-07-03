import { proxyBrainRequest } from "@/lib/brain/server-proxy";
import { brainRouteConfig } from "@/lib/brain/route-config";

export const runtime = brainRouteConfig.runtime;
export const dynamic = brainRouteConfig.dynamic;
export const maxDuration = brainRouteConfig.maxDuration;

export async function GET(request: Request) {
  return proxyBrainRequest("/auth/me", request);
}
