export interface HttpTransportRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
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

  const started = performance.now();
  const response = await fetch(request.url, {
    method: request.method,
    headers: {
      "content-type": "application/json",
      ...(request.headers ?? {}),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  let json: unknown = null;
  const text = await response.text();
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
