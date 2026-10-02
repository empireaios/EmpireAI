import type { FastifyReply } from "fastify";
import {
  extractChatMessagePreview,
  type PillowProxyAttemptResult,
} from "./pillow-accepted-request-recovery.js";

const HOP_BY_HOP = [
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
];

function hopByHopHeaders(connection: string | null): Set<string> {
  return new Set([...HOP_BY_HOP, ...(connection ?? "").split(",").map((name) => name.trim().toLowerCase())]);
}

export function workerRequestHeaders(incoming: Record<string, string | string[] | undefined>): Record<string, string> {
  const connection = incoming.connection;
  const skip = hopByHopHeaders(Array.isArray(connection) ? connection.join(",") : connection ?? null);
  skip.add("host");
  skip.add("content-length");
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined || skip.has(key.toLowerCase())) continue;
    headers[key] = Array.isArray(value) ? value.join(key.toLowerCase() === "cookie" ? "; " : ",") : value;
  }
  return headers;
}

/** `ok` means an HTTP response was received, not that the application accepted the request. */
export async function forwardWorkerHttpRequest(options: {
  target: string;
  method: string;
  headers: Record<string, string>;
  body?: string | Buffer;
  timeoutMs: number;
}): Promise<PillowProxyAttemptResult> {
  try {
    const upstream = await fetch(options.target, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal: AbortSignal.timeout(options.timeoutMs),
      // Relay redirects to the caller; never follow a worker redirect with owner credentials.
      redirect: "manual",
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    return {
      ok: true,
      status: upstream.status,
      body,
      headers: upstream.headers,
      messagePreview: extractChatMessagePreview(body),
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network", error };
  }
}

export function sendWorkerHttpResponse(reply: FastifyReply, response: Extract<PillowProxyAttemptResult, { ok: true }>): FastifyReply {
  const skip = hopByHopHeaders(response.headers.get("connection"));
  // Fetch decompresses the body; Fastify must generate the new wire length.
  skip.add("content-encoding");
  skip.add("content-length");
  skip.add("set-cookie");
  response.headers.forEach((value, key) => {
    if (!skip.has(key.toLowerCase())) reply.header(key, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) reply.header("set-cookie", cookies);
  return reply.code(response.status).send(response.body);
}
