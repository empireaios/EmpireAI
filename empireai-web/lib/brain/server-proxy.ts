const LOCAL_BRAIN_URL = "http://localhost:4000";

/** Resolve Brain API base URL for server-side BFF proxy routes. */
export function resolveBrainApiUrl(): string {
  const configured = process.env.BRAIN_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (process.env.VERCEL) {
    throw new Error(
      "BRAIN_API_URL is not configured. Set it to your Railway Brain URL in Vercel project settings.",
    );
  }

  return LOCAL_BRAIN_URL;
}

function forwardCookie(request: Request): string | undefined {
  return request.headers.get("cookie") ?? undefined;
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
  init?: RequestInit,
): Promise<Response> {
  let brainApiUrl: string;

  try {
    brainApiUrl = resolveBrainApiUrl();
  } catch (error) {
    return brainProxyErrorResponse(error, 503);
  }

  const url = `${brainApiUrl}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        cookie: forwardCookie(request) ?? "",
      },
      cache: "no-store",
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
    return brainProxyErrorResponse(error, 502);
  }
}

/** @deprecated Use resolveBrainApiUrl() so production misconfiguration fails clearly. */
export const BRAIN_API_URL = process.env.BRAIN_API_URL ?? LOCAL_BRAIN_URL;
