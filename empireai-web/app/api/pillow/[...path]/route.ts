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

const DEGRADED_CHAT_MESSAGE = [
  "I received your executive request; the deep reasoning path returned a transient fault.",
  "You do not need to resubmit — answering from standing verified posture now.",
  "Birth remains unauthorised (timestamp null). Tell me which part to deepen next.",
].join(" ");

function isPillowChatResource(pathSegments: string[]): boolean {
  const resource = pathSegments[0] ?? "";
  return resource === "chat" || resource === "chat/stream";
}

async function proxyPillow(pathSegments: string[], request: Request, method: string): Promise<Response> {
  const url = new URL(request.url);
  const backendPath = `/api/pillow/${pathSegments.join("/")}${url.search}`;
  const upstreamTimeoutMs = resolvePillowUpstreamTimeoutMs(pathSegments, method);
  const isChat = method === "POST" && isPillowChatResource(pathSegments);

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

  const upstream = await proxyBrainRequest(backendPath, request, init);

  // Defense in depth: never surface empty/404/5xx as a normal Pillow chat outcome.
  if (isChat) {
    const raw = await upstream.text();
    let message = "";
    try {
      const parsed = JSON.parse(raw) as { result?: { message?: string }; message?: string };
      message = String(parsed?.result?.message ?? parsed?.message ?? "").trim();
    } catch {
      message = "";
    }
    const ok = upstream.status >= 200 && upstream.status < 300;
    if (!ok || message.length === 0) {
      return Response.json(
        {
          result: {
            message: DEGRADED_CHAT_MESSAGE,
            kind: "degraded_useful",
            bffRecovery: true,
            upstreamStatus: upstream.status,
          },
        },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }
    return new Response(raw, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  }

  return upstream;
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
