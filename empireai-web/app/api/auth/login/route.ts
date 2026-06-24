import { NextResponse } from "next/server";
import { proxyBrainRequest } from "@/lib/brain/server-proxy";

export async function POST(request: Request) {
  const body = await request.text();
  return proxyBrainRequest("/auth/login", request, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
