/**
 * G8-02 — Authorization Centre future Cockpit contracts.
 */

import type { AuthorizationRequest, AuthorizationResult } from "./authorization-framework-types.js";

export type CockpitAuthorizationFlowView = {
  viewId: "cockpit-authorization-flow";
  computedAt: string;
  dataMode: "authorization-framework";
  authorizationStartSupported: true;
  presentationDeferred: true;
  futureMission: "G8-05";
  request?: AuthorizationRequest;
  result?: AuthorizationResult;
  requiredScopes: string[];
  missingPermissions: string[];
  expiry: string | null;
  reconnectState: string;
  discoverySource: "authorization-framework:cockpit";
  designLanguage: "g4-cockpit";
};

export function buildCockpitAuthorizationFlowView(input: {
  request?: AuthorizationRequest;
  result?: AuthorizationResult;
}): CockpitAuthorizationFlowView {
  return {
    viewId: "cockpit-authorization-flow",
    computedAt: new Date().toISOString(),
    dataMode: "authorization-framework",
    authorizationStartSupported: true,
    presentationDeferred: true,
    futureMission: "G8-05",
    request: input.request,
    result: input.result,
    requiredScopes: input.request?.requestedScopes ?? [],
    missingPermissions: input.result?.missingPermissions ?? [],
    expiry: input.result?.expiresAt ?? input.request?.expiresAt ?? null,
    reconnectState:
      input.result?.status === "expired" || input.result?.status === "revoked"
        ? "requires_reconnect"
        : "stable",
    discoverySource: "authorization-framework:cockpit",
    designLanguage: "g4-cockpit",
  };
}
