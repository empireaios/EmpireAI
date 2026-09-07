import {
  PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
  PILLOW_SESSION_UPSTREAM_TIMEOUT_MS,
  PILLOW_UPSTREAM_TIMEOUT_MS,
  proxyBrainRequest,
} from "@/lib/brain/server-proxy";
import { decideBffChatSurface, DEGRADED_CHAT_MESSAGE } from "@/lib/pillow/bff-chat-sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Repair 2: first-request complex deliberation must finish under Pro budget. */
export const maxDuration = 300;

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

function isPillowChatResource(pathSegments: string[]): boolean {
  const resource = pathSegments[0] ?? "";
  return resource === "chat" || resource === "chat/stream";
}

async function proxyPillow(pathSegments: string[], request: Request, method: string): Promise<Response> {
  const url = new URL(request.url);
  const backendPath = `/api/pillow/${pathSegments.join("/")}${url.search}`;
  const upstreamTimeoutMs = resolvePillowUpstreamTimeoutMs(pathSegments, method);
  const isChat = method === "POST" && isPillowChatResource(pathSegments);
  const bodyText = method !== "GET" && method !== "DELETE" ? await request.text() : undefined;
  let userAsk = "";
  if (isChat && bodyText) {
    try {
      userAsk = String((JSON.parse(bodyText) as { message?: string }).message ?? "");
    } catch {
      userAsk = "";
    }
  }

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
  if (bodyText !== undefined) init.body = bodyText;

  // Reasoning chat: one BFF-level retry on gateway timeouts / 5xx (idempotent).
  const maxAttempts = isChat ? 2 : 1;
  let upstream = await proxyBrainRequest(backendPath, request, init);
  if (isChat) {
    for (let attempt = 1; attempt < maxAttempts; attempt++) {
      const status = upstream.status;
      if (!(status === 502 || status === 503 || status === 504)) break;
      await new Promise((r) => setTimeout(r, 800 * attempt));
      upstream = await proxyBrainRequest(backendPath, request, init);
    }
  }

  if (isChat) {
    const raw = await upstream.text();
    const ok = upstream.status >= 200 && upstream.status < 300;
    const decision = decideBffChatSurface({
      upstreamOk: ok,
      rawBody: raw,
      userAsk,
    });

    if (decision.degrade) {
      return Response.json(
        {
          result: {
            message: DEGRADED_CHAT_MESSAGE,
            kind: "terminal_infrastructure",
            surfaceClass: "terminal_infrastructure",
            semanticSuccess: false,
            bffRecovery: true,
            upstreamStatus: upstream.status,
            degradeReason: decision.reason,
            userResubmissionRequired: false,
            firstRequestCompleted: false,
          },
        },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }

    if (decision.stripped) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === "object") {
          const result =
            parsed.result && typeof parsed.result === "object"
              ? { ...(parsed.result as Record<string, unknown>) }
              : {};
          result.message = decision.message;
          parsed.result = result;
          if (typeof parsed.message === "string") parsed.message = decision.message;
          return new Response(JSON.stringify(parsed), {
            status: upstream.status,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
              "x-empire-bff-footer-stripped": "1",
            },
          });
        }
      } catch {
        /* fall through */
      }
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
