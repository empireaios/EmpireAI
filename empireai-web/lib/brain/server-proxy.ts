const LOCAL_BRAIN_URL = "http://localhost:4000";
const PRODUCTION_BRAIN_URL = "https://empireai-production.up.railway.app";
const UPSTREAM_TIMEOUT_MS = 25_000;
/** Auth must survive transient Brain lag; keep under Vercel route maxDuration. */
const AUTH_UPSTREAM_TIMEOUT_MS = 55_000;
const DISPATCH_UPSTREAM_TIMEOUT_MS = 55_000;
/**
 * Pillow chat: context assembly + LLM + Tier-0 bounded recovery.
 * Must stay under Vercel route maxDuration (130s on pillow catch-all).
 * Must exceed Tier-0 recovery budget (~118s) so BFF is not the shorter killer.
 */
const PILLOW_UPSTREAM_TIMEOUT_MS = 125_000;
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

/** Railway edge 502 bodies use `message`, not `error` — normalize for the login UI. */
function normalizeUpstreamAuthFailureBody(
  status: number,
  bodyText: string,
  contentType: string | null,
): { body: string; contentType: string } {
  const isJson = Boolean(contentType?.includes("application/json"));
  let parsed: Record<string, unknown> | null = null;
  if (isJson) {
    try {
      parsed = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (status === 401 || status === 403) {
    if (parsed && typeof parsed.error === "string") {
      return { body: bodyText, contentType: contentType ?? "application/json" };
    }
    return {
      body: JSON.stringify({ error: "Invalid email or password" }),
      contentType: "application/json",
    };
  }

  if (status === 502 || status === 503 || status === 504) {
    const upstreamMessage =
      (parsed && typeof parsed.error === "string" && parsed.error) ||
      (parsed && typeof parsed.message === "string" && parsed.message) ||
      bodyText?.slice(0, 200) ||
      "Brain unavailable";
    return {
      body: JSON.stringify({
        error: `Authentication service unavailable (${status}): ${upstreamMessage}`,
        code: status,
      }),
      contentType: "application/json",
    };
  }

  if (parsed && typeof parsed.error !== "string" && typeof parsed.message === "string") {
    return {
      body: JSON.stringify({ ...parsed, error: parsed.message }),
      contentType: "application/json",
    };
  }

  return { body: bodyText, contentType: contentType ?? "application/json" };
}

function isAuthProxyPath(path: string): boolean {
  return (
    path === "/auth/login" ||
    path === "/auth/logout" ||
    path === "/auth/me" ||
    path === "/auth/refresh"
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getUpstreamSetCookies(headers: Headers): string[] {
  const withGetter = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withGetter.getSetCookie === "function") {
    return withGetter.getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}

/**
 * Rewrite Brain Set-Cookie for the Next.js BFF origin.
 * Strips Domain (host-only on Vercel) and ensures Secure on Vercel HTTPS.
 */
export function rewriteSetCookieForBff(raw: string): string {
  const parts = raw.split(";").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return raw;

  const rewritten: string[] = [parts[0]!];
  let hasPath = false;
  let hasSameSite = false;
  let hasHttpOnly = false;
  let hasSecure = false;

  for (const part of parts.slice(1)) {
    if (/^domain=/i.test(part)) continue;
    if (/^path=/i.test(part)) {
      hasPath = true;
      rewritten.push("Path=/");
      continue;
    }
    if (/^samesite=/i.test(part)) {
      hasSameSite = true;
      rewritten.push("SameSite=Lax");
      continue;
    }
    if (/^httponly$/i.test(part)) {
      hasHttpOnly = true;
      rewritten.push("HttpOnly");
      continue;
    }
    if (/^secure$/i.test(part)) {
      hasSecure = true;
      if (process.env.VERCEL || process.env.NODE_ENV === "production") {
        rewritten.push("Secure");
      }
      continue;
    }
    rewritten.push(part);
  }

  if (!hasPath) rewritten.push("Path=/");
  if (!hasSameSite) rewritten.push("SameSite=Lax");
  if (!hasHttpOnly && /^empireai_session=/i.test(parts[0]!)) {
    rewritten.push("HttpOnly");
  }
  if (
    !hasSecure &&
    (process.env.VERCEL || process.env.NODE_ENV === "production") &&
    /^empireai_session=/i.test(parts[0]!)
  ) {
    rewritten.push("Secure");
  }

  return rewritten.join("; ");
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
  const authPath = isAuthProxyPath(path);
  const maxAttempts = authPath ? 3 : 1;

  try {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

        const rawBody = await response.text();
        const contentType = response.headers.get("content-type");

        // Retry only transient Brain unavailability on auth — never retry 401.
        if (
          authPath &&
          attempt < maxAttempts &&
          (response.status === 502 || response.status === 503 || response.status === 504)
        ) {
          await sleep(400 * attempt);
          continue;
        }

        const normalized = authPath
          ? normalizeUpstreamAuthFailureBody(response.status, rawBody, contentType)
          : { body: rawBody, contentType: contentType ?? "application/json" };

        const headers = new Headers();
        if (normalized.contentType) {
          headers.set("content-type", normalized.contentType);
        }

        const setCookies = getUpstreamSetCookies(response.headers).map(rewriteSetCookieForBff);
        for (const cookie of setCookies) {
          headers.append("set-cookie", cookie);
        }

        return new Response(normalized.body, {
          status: response.status,
          headers,
        });
      } catch (error) {
        lastError = error;
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        // Auth must retry timeouts too — Brain restart/sql.js flush commonly stalls login.
        if (authPath && attempt < maxAttempts) {
          await sleep(timedOut ? 800 * attempt : 400 * attempt);
          continue;
        }
        if (timedOut) {
          return brainProxyErrorResponse(
            new Error(
              `Authentication service timed out after ${upstreamTimeoutMs}ms. Brain may be restarting — retry shortly.`,
            ),
            504,
          );
        }
        throw error;
      }
    }
    return brainProxyErrorResponse(lastError ?? new Error("Brain proxy request failed"), 502);
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
