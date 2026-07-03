import { resolveBrainApiUrl } from "@/lib/brain/server-proxy";
import { brainRouteConfig } from "@/lib/brain/route-config";

export const runtime = brainRouteConfig.runtime;
export const dynamic = brainRouteConfig.dynamic;
export const maxDuration = brainRouteConfig.maxDuration;

const UPSTREAM_TIMEOUT_MS = 25_000;

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";

  let brainApiUrl: string;
  try {
    brainApiUrl = resolveBrainApiUrl();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Brain API URL is not configured";
    return new Response(message, { status: 503 });
  }

  try {
    const upstream = await fetch(`${brainApiUrl}/brain/events/stream`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Brain event stream proxy failed";
    return new Response(message, { status: 502 });
  }
}
