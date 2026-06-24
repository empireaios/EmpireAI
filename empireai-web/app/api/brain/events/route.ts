import { BRAIN_API_URL } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const upstream = await fetch(`${BRAIN_API_URL}/brain/events/stream`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to connect to Brain event stream", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
