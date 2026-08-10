import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyCommissioning(
  pathSegments: string[],
  request: Request,
  method: string,
): Promise<Response> {
  const url = new URL(request.url);
  const backendPath = `/pillow-commissioning/${pathSegments.join("/")}${url.search}`;
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
  return proxyCommissioning(path, request, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxyCommissioning(path, request, "POST");
}
