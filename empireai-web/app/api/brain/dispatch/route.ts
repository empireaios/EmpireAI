import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBrainRequest("/brain/dispatch", request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
