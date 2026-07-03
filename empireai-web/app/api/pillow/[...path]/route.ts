import { proxyBrainRequest } from "@/lib/brain/server-proxy";
import { brainRouteConfig } from "@/lib/brain/route-config";

export const runtime = brainRouteConfig.runtime;
export const dynamic = brainRouteConfig.dynamic;
export const maxDuration = brainRouteConfig.maxDuration;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyPillow(pathSegments: string[], request: Request, method: string): Promise<Response> {
  const url = new URL(request.url);
  const backendPath = `/api/pillow/${pathSegments.join("/")}${url.search}`;

  const init: RequestInit = {
    method,
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      ...(method !== "GET" && method !== "DELETE"
        ? { "Content-Type": request.headers.get("content-type") ?? "application/json" }
        : {}),
    },
    cache: "no-store",
  };

  if (method !== "GET" && method !== "DELETE") {
    init.body = await request.text();
  }

  return proxyBrainRequest(backendPath, request, init);
}

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "POST");
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyPillow(path, request, "DELETE");
}
