import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export async function GET(request: Request) {
  return proxyBrainRequest("/auth/me", request);
}
