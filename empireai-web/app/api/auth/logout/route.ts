import {
  buildClearSessionCookieHeader,
  proxyBrainRequest,
} from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  await proxyBrainRequest("/auth/logout", request, { method: "POST" }).catch(() => null);
  return Response.json(
    { ok: true },
    {
      status: 200,
      headers: { "set-cookie": buildClearSessionCookieHeader() },
    },
  );
}
