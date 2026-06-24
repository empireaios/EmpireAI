import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBrainRequest("/brain/dispatch", request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
