import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return proxyBrainRequest("/auth/logout", request, { method: "POST" });
}
