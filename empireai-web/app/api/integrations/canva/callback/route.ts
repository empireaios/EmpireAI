import { NextResponse } from "next/server";

import { resolveBrainApiUrl } from "@/lib/brain/server-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTEGRATIONS_PATH = "/cockpit/infrastructure/integrations";

function redirectToIntegrations(
  request: Request,
  params: Record<string, string>,
): NextResponse {
  const url = new URL(INTEGRATIONS_PATH, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

/**
 * Canonical production Canva OAuth callback (register in Canva Connect app):
 * https://empire-ai.co/api/integrations/canva/callback
 */
export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const oauthErrorDescription = url.searchParams.get("error_description");

  if (oauthError) {
    return redirectToIntegrations(request, {
      canva: "error",
      reason: oauthErrorDescription ?? oauthError,
    });
  }

  if (!code || !state) {
    return redirectToIntegrations(request, {
      canva: "error",
      reason: "missing_oauth_params",
    });
  }

  let brainApiUrl: string;
  try {
    brainApiUrl = resolveBrainApiUrl();
  } catch (error) {
    const message = error instanceof Error ? error.message : "brain_unconfigured";
    return redirectToIntegrations(request, { canva: "error", reason: message });
  }

  const callbackUrl = new URL("/canva/oauth/callback", brainApiUrl);
  callbackUrl.searchParams.set("code", code);
  callbackUrl.searchParams.set("state", state);

  try {
    const response = await fetch(callbackUrl.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      return redirectToIntegrations(request, {
        canva: "error",
        reason: body.error ?? `exchange_failed_${response.status}`,
      });
    }

    return redirectToIntegrations(request, { canva: "connected" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "brain_unreachable";
    return redirectToIntegrations(request, { canva: "error", reason: message });
  }
}
