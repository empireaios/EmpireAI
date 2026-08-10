import {
  PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
  PILLOW_SESSION_UPSTREAM_TIMEOUT_MS,
  PILLOW_UPSTREAM_TIMEOUT_MS,
  proxyBrainRequest,
} from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 130;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function resolvePillowUpstreamTimeoutMs(pathSegments: string[], method: string): number {
  const resource = pathSegments[0] ?? "";
  if (resource === "health" || resource === "status") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  // Secondary awareness polls — fail fast so Executive Home stays interactive.
  if (resource === "founder-shell" || resource === "commerce-operating-model") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "session") {
    return PILLOW_SESSION_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "chat" || resource === "chat/stream") {
    return PILLOW_UPSTREAM_TIMEOUT_MS;
  }
  if (method === "GET") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  return PILLOW_UPSTREAM_TIMEOUT_MS;
}

async function proxyPillow(pathSegments: string[], request: Request, method: string): Promise<Response> {
  const url = new URL(request.url);
  const backendPath = `/api/pillow/${pathSegments.join("/")}${url.search}`;
  const upstreamTimeoutMs = resolvePillowUpstreamTimeoutMs(pathSegments, method);

  const init: RequestInit & { upstreamTimeoutMs?: number } = {
    method,
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      ...(method !== "GET" && method !== "DELETE"
        ? { "Content-Type": request.headers.get("content-type") ?? "application/json" }
        : {}),
    },
    cache: "no-store",
    upstreamTimeoutMs,
  };

  if (method !== "GET" && method !== "DELETE") {
    init.body = await request.text();
  }

  return proxyBrainRequest(backendPath, request, init);
}

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "POST");
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "DELETE");
}
