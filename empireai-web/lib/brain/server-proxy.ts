const BRAIN_API_URL = process.env.BRAIN_API_URL ?? "http://localhost:4000";

function forwardCookie(request: Request): string | undefined {
  return request.headers.get("cookie") ?? undefined;
}

export async function proxyBrainRequest(
  path: string,
  request: Request,
  init?: RequestInit,
): Promise<Response> {
  const url = `${BRAIN_API_URL}${path}`;
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
}

export { BRAIN_API_URL };
