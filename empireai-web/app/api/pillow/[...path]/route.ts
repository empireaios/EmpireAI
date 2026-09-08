import {
  PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
  PILLOW_SESSION_UPSTREAM_TIMEOUT_MS,
  PILLOW_UPSTREAM_TIMEOUT_MS,
  proxyBrainRequest,
} from "@/lib/brain/server-proxy";
import {
  buildShellTraceFromDecision,
  decideBffChatSurface,
  DEGRADED_CHAT_MESSAGE,
} from "@/lib/pillow/bff-chat-sanitize";
import { shellDeliveryDashboard } from "@/lib/pillow/shell-delivery-observability";

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
  if (resource === "founder-shell" || resource === "commerce-operating-model") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "session") {
    return PILLOW_SESSION_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "chat" || resource === "chat/stream") {
    return PILLOW_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "shell-observability") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "delivery-forensics") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
  }
  if (resource === "chat-request" || resource === "chat-requests") {
    return PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS;
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

function forwardPillowHeaders(from: Headers, into: Headers): void {
  for (const key of [
    "x-empire-pillow-request-id",
    "x-empire-pillow-request-kind",
    "x-empire-pillow-recovery",
  ]) {
    const v = from.get(key);
    if (v) into.set(key, v);
  }
}

async function proxyPillow(pathSegments: string[], request: Request, method: string): Promise<Response> {
  // Local BFF observability dashboard (does not hit Brain).
  if (method === "GET" && pathSegments[0] === "shell-observability") {
    return Response.json(
      { ok: true, dashboard: shellDeliveryDashboard() },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  // Durable Tier-0 forensics — proxy to Brain primary (survives worker recycle).
  if (method === "GET" && pathSegments[0] === "delivery-forensics") {
    const url = new URL(request.url);
    const upstream = await proxyBrainRequest(
      `/api/pillow/delivery-forensics${url.search}`,
      request,
      {
        method: "GET",
        headers: { cookie: request.headers.get("cookie") ?? "" },
        cache: "no-store",
        upstreamTimeoutMs: PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
      },
    );
    return upstream;
  }

  const url = new URL(request.url);
  const backendPath = `/api/pillow/${pathSegments.join("/")}${url.search}`;
  const upstreamTimeoutMs = resolvePillowUpstreamTimeoutMs(pathSegments, method);
  const isChat = method === "POST" && isPillowChatResource(pathSegments);
  let bodyText = method !== "GET" && method !== "DELETE" ? await request.text() : undefined;
  let userAsk = "";
  let sessionId: string | null = null;
  if (isChat && bodyText) {
    try {
      const parsed = JSON.parse(bodyText) as {
        message?: string;
        sessionId?: string;
        workspaceContext?: {
          recentConversationTurns?: Array<{ role?: string; content?: string }>;
        };
      };
      userAsk = String(parsed.message ?? "");
      sessionId = parsed.sessionId ? String(parsed.sessionId) : null;
      // BFF context admission (Gen3 class) — truncate continuity turns before Brain Zod.
      const turns = parsed.workspaceContext?.recentConversationTurns;
      if (Array.isArray(turns)) {
        parsed.workspaceContext = {
          ...parsed.workspaceContext,
          recentConversationTurns: turns.slice(-16).map((t) => ({
            ...t,
            content:
              String(t?.content ?? "").length > 8000
                ? `${String(t.content).slice(0, 7970)}…`
                : t?.content,
          })),
        };
        bodyText = JSON.stringify(parsed);
      }
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
    const t0 = Date.now();
    const raw = await upstream.text();
    const ok = upstream.status >= 200 && upstream.status < 300;
    const requestId = upstream.headers.get("x-empire-pillow-request-id");
    const decision = decideBffChatSurface({
      upstreamOk: ok,
      rawBody: raw,
      userAsk,
    });
    const trace = buildShellTraceFromDecision({
      decision,
      upstreamStatus: upstream.status,
      httpStatus: 200,
      sessionId,
      requestId,
      component: "bff.proxyPillow.chat",
      shellDurationMs: Date.now() - t0,
    });

    const obsHeaders = new Headers({
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-empire-shell-trace-id": trace.traceId,
      "x-empire-brain-output-hash": trace.brainOutputHash,
      "x-empire-shell-output-hash": trace.shellOutputHash,
      "x-empire-delivery-class": trace.deliveryClass,
      "x-empire-brain-to-user-equivalent": trace.brainToUserEquivalent ? "1" : "0",
    });
    forwardPillowHeaders(upstream.headers, obsHeaders);

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
            failureClass: decision.failureClass,
            deliveryClass: decision.deliveryClass,
            brainToUserEquivalent: false,
            shellTraceId: trace.traceId,
            brainOutputHash: trace.brainOutputHash,
            userResubmissionRequired: true,
            firstRequestCompleted: false,
          },
        },
        { status: 200, headers: obsHeaders },
      );
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        const result =
          parsed.result && typeof parsed.result === "object"
            ? { ...(parsed.result as Record<string, unknown>) }
            : {};
        result.message = decision.message;
        result.shellTraceId = trace.traceId;
        result.brainOutputHash = trace.brainOutputHash;
        result.shellOutputHash = trace.shellOutputHash;
        result.deliveryClass = decision.deliveryClass;
        result.brainToUserEquivalent = decision.brainToUserEquivalent;
        parsed.result = result;
        if (typeof parsed.message === "string") parsed.message = decision.message;
        if (decision.stripped || decision.preservedOriginalBecauseStripEmpty) {
          obsHeaders.set(
            "x-empire-bff-footer-stripped",
            decision.preservedOriginalBecauseStripEmpty ? "preserved" : "1",
          );
        }
        return new Response(JSON.stringify(parsed), {
          status: upstream.status >= 200 && upstream.status < 300 ? upstream.status : 200,
          headers: obsHeaders,
        });
      }
    } catch {
      /* fall through */
    }

    return new Response(raw, {
      status: upstream.status,
      headers: obsHeaders,
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
