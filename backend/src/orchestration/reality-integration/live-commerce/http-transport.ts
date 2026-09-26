export interface HttpTransportRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export interface HttpTransportResponse {
  status: number;
  ok: boolean;
  json: unknown;
  latencyMs: number;
}

export type HttpTransport = (request: HttpTransportRequest) => Promise<HttpTransportResponse>;

let transportOverride: HttpTransport | null = null;

export function setHttpTransportOverride(transport: HttpTransport | null): void {
  transportOverride = transport;
}

export function resetHttpTransportOverride(): void {
  transportOverride = null;
}

export async function httpTransport(request: HttpTransportRequest): Promise<HttpTransportResponse> {
  if (transportOverride) return transportOverride(request);

  const timeoutMs = request.timeoutMs ?? 15_000;
  const maxBytes = request.maxResponseBytes;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000 ||
      (maxBytes !== undefined && (!Number.isSafeInteger(maxBytes) || maxBytes < 1 ||
        maxBytes > 16 * 1024 * 1024))) {
    throw new Error("HTTP transport resource limits invalid");
  }
  const started = performance.now();
  const response = await fetch(request.url, {
    method: request.method,
    headers: {
      "content-type": "application/json",
      ...(request.headers ?? {}),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  let json: unknown = null;
  let text: string;
  if (maxBytes === undefined || !response.body) {
    text = await response.text();
  } else {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) {
          void reader.cancel().catch(() => undefined);
          throw new Error("HTTP transport response exceeds byte limit");
        }
        chunks.push(value);
      }
      text = Buffer.concat(chunks).toString("utf8");
    } finally {
      reader.releaseLock();
    }
  }
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    json,
    latencyMs: Math.round(performance.now() - started),
  };
}
