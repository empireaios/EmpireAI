import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return proxyBrainRequest("/commerce/marketplace-integration/cockpit", request, {
    method: "GET",
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
}
