import {
  PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
  PILLOW_SESSION_UPSTREAM_TIMEOUT_MS,
  PILLOW_UPSTREAM_TIMEOUT_MS,
  proxyBrainRequest,
} from "@/lib/brain/server-proxy";

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

/** Honest terminal — never soft success; never ask Grand King to invent a new ask. */
const DEGRADED_CHAT_MESSAGE = [
  "I accepted your request, but a completed executive answer was not produced within the infrastructure budget.",
  "This is a temporary system limit — not a judgment on your ask.",
  "The system retains ownership of this accepted request for internal recovery.",
].join(" ");

function isPillowChatResource(pathSegments: string[]): boolean {
  const resource = pathSegments[0] ?? "";
  return resource === "chat" || resource === "chat/stream";
}

function extractMessageFromBody(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { result?: { message?: string }; message?: string };
    return String(parsed?.result?.message ?? parsed?.message ?? "").trim();
  } catch {
    return "";
  }
}

function looksLikeForbiddenInfraDecoration(message: string, userAsk: string): boolean {
  const ask = String(userAsk || "");
  const synthetic =
    /\b(?:synthetic(?:canary)?|scenario\s+only|do\s+not\s+mention\s+(?:empireai|birth))\b/i.test(ask);
  if (synthetic || !/\bbirth\b/i.test(ask)) {
    if (/\bBirth remains unauthoris/i.test(message)) return true;
    if (/\brealised commerce|product focus|commissioning state\b/i.test(message)) return true;
  }
  if (/\btell me which (?:theme|part) to deepen\b/i.test(message)) return true;
  if (/\bworker proxy timed out\b/i.test(message)) return true;
  return false;
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
    const message = extractMessageFromBody(raw);
    const ok = upstream.status >= 200 && upstream.status < 300;
    if (!ok || message.length === 0 || looksLikeForbiddenInfraDecoration(message, userAsk)) {
      return Response.json(
        {
          result: {
            message: DEGRADED_CHAT_MESSAGE,
            kind: "terminal_infrastructure",
            surfaceClass: "terminal_infrastructure",
            semanticSuccess: false,
            bffRecovery: true,
            upstreamStatus: upstream.status,
            userResubmissionRequired: false,
            firstRequestCompleted: false,
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
