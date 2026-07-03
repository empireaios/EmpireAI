/**
 * G8-00 — Cockpit Identity & Authorization backend contracts (registration only).
 */

import type { IdentityPlatformOverview, IdentityPlatformSummary } from "./identity-authorization-types.js";

export const COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID = "cockpit-identity-authorization" as const;

export type CockpitIdentityAuthorizationRouteRegistration = {
  routeId: "cockpit.operations.identity-authorization";
  moduleId: typeof COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID;
  section: "Operations";
  label: "Identity & Authorization";
  presentationDeferred: true;
  backendContractOnly: true;
  futureMission: "G8-01+";
};

export type CockpitIdentityAuthorizationView = {
  viewId: typeof COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID;
  computedAt: string;
  dataMode: "identity-authorization";
  overview: IdentityPlatformOverview;
  summary: IdentityPlatformSummary;
  discoverySource: "identity-authorization-platform:cockpit";
  designLanguage: "g4-cockpit";
};

export function createCockpitIdentityAuthorizationRouteRegistration(): CockpitIdentityAuthorizationRouteRegistration {
  return {
    routeId: "cockpit.operations.identity-authorization",
    moduleId: COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID,
    section: "Operations",
    label: "Identity & Authorization",
    presentationDeferred: true,
    backendContractOnly: true,
    futureMission: "G8-01+",
  };
}

export function buildCockpitIdentityAuthorizationView(input: {
  overview: IdentityPlatformOverview;
  summary: IdentityPlatformSummary;
}): CockpitIdentityAuthorizationView {
  return {
    viewId: COCKPIT_IDENTITY_AUTHORIZATION_MODULE_ID,
    computedAt: new Date().toISOString(),
    dataMode: "identity-authorization",
    overview: input.overview,
    summary: input.summary,
    discoverySource: "identity-authorization-platform:cockpit",
    designLanguage: "g4-cockpit",
  };
}
