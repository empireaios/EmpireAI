const LOCAL_BRAIN_URL = "http://localhost:4000";
const PRODUCTION_BRAIN_URL = "https://empireai-production.up.railway.app";
const UPSTREAM_TIMEOUT_MS = 25_000;
const AUTH_UPSTREAM_TIMEOUT_MS = 20_000;
const DISPATCH_UPSTREAM_TIMEOUT_MS = 55_000;
/** Pillow chat runs context assembly + LLM — must stay under Vercel maxDuration (60s). */
const PILLOW_UPSTREAM_TIMEOUT_MS = 58_000;
const PILLOW_SESSION_UPSTREAM_TIMEOUT_MS = 130_000;
const PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS = 10_000;

/** Resolve Brain API base URL for server-side BFF proxy routes. */
export function resolveBrainApiUrl(): string {
  const configured = process.env.BRAIN_API_URL?.trim();

  if (process.env.VERCEL) {
    let resolved = (configured || PRODUCTION_BRAIN_URL).replace(/\/$/, "");
    if (/localhost|127\.0\.0\.1/i.test(resolved)) {
      resolved = PRODUCTION_BRAIN_URL;
    }
    if (!/^https:\/\//i.test(resolved)) {
      throw new Error(
        `BRAIN_API_URL must be an absolute https URL on Vercel (received "${configured}").`,
      );
    }
    return resolved;
  }

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return LOCAL_BRAIN_URL;
}

function forwardCookie(request: Request): string | undefined {
  return request.headers.get("cookie") ?? undefined;
}

/** Clear stale HttpOnly session cookie (invalid/expired sessions). */
export function buildClearSessionCookieHeader(): string {
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `empireai_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}

function withClearedSessionCookie(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("set-cookie", buildClearSessionCookieHeader());
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function brainProxyErrorResponse(
  error: unknown,
  status: number,
): Response {
  const message =
    error instanceof Error ? error.message : "Brain proxy request failed";

  return Response.json({ error: message }, { status });
}

export async function proxyBrainRequest(
  path: string,
  request: Request,
  init?: RequestInit & { upstreamTimeoutMs?: number },
): Promise<Response> {
  let brainApiUrl: string;
  const upstreamTimeoutMs = init?.upstreamTimeoutMs ?? UPSTREAM_TIMEOUT_MS;

  try {
    brainApiUrl = resolveBrainApiUrl();
  } catch (error) {
    return brainProxyErrorResponse(error, 503);
  }

  const url = `${brainApiUrl}${path}`;

  try {
    const upstreamAbort = AbortSignal.timeout(upstreamTimeoutMs);
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        cookie: forwardCookie(request) ?? "",
      },
      cache: "no-store",
      signal: init?.signal ?? upstreamAbort,
    });

    const body = await response.text();
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) headers.set("set-cookie", setCookie);

    return new Response(body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return brainProxyErrorResponse(
        new Error(
          `Brain API timed out after ${upstreamTimeoutMs}ms (${brainApiUrl}). Check BRAIN_API_URL on Vercel.`,
        ),
        504,
      );
    }
    return brainProxyErrorResponse(error, 502);
  }
}

/** @deprecated Use resolveBrainApiUrl() so production misconfiguration fails clearly. */
export const BRAIN_API_URL = process.env.BRAIN_API_URL ?? LOCAL_BRAIN_URL;

export {
  AUTH_UPSTREAM_TIMEOUT_MS,
  DISPATCH_UPSTREAM_TIMEOUT_MS,
  PILLOW_HEALTH_UPSTREAM_TIMEOUT_MS,
  PILLOW_SESSION_UPSTREAM_TIMEOUT_MS,
  PILLOW_UPSTREAM_TIMEOUT_MS,
  withClearedSessionCookie,
};
