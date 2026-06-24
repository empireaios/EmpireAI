import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export async function POST(request: Request) {
  return proxyBrainRequest("/auth/logout", request, { method: "POST" });
}
