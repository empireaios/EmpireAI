/**
 * G8-01 — Connection Registry Cockpit backend contracts (Authorization Centre deferred).
 */

import type { WorkspaceConnectionProfile } from "./connection-registry-types.js";

export const COCKPIT_CONNECTION_REGISTRY_MODULE_ID = "cockpit-connection-registry" as const;

export type CockpitAuthorizationCentreRouteRegistration = {
  routeId: "cockpit.operations.authorization-centre";
  moduleId: typeof COCKPIT_CONNECTION_REGISTRY_MODULE_ID;
  section: "Operations";
  label: "Authorization Centre";
  presentationDeferred: true;
  backendContractOnly: true;
  futureMission: "G8-05";
};

export type CockpitConnectionRegistryView = {
  viewId: typeof COCKPIT_CONNECTION_REGISTRY_MODULE_ID;
  computedAt: string;
  dataMode: "connection-registry";
  profile: WorkspaceConnectionProfile;
  discoverySource: "connection-registry:cockpit";
  designLanguage: "g4-cockpit";
};

export function createCockpitAuthorizationCentreRouteRegistration(): CockpitAuthorizationCentreRouteRegistration {
  return {
    routeId: "cockpit.operations.authorization-centre",
    moduleId: COCKPIT_CONNECTION_REGISTRY_MODULE_ID,
    section: "Operations",
    label: "Authorization Centre",
    presentationDeferred: true,
    backendContractOnly: true,
    futureMission: "G8-05",
  };
}

export function buildCockpitConnectionRegistryView(input: {
  profile: WorkspaceConnectionProfile;
}): CockpitConnectionRegistryView {
  return {
    viewId: COCKPIT_CONNECTION_REGISTRY_MODULE_ID,
    computedAt: new Date().toISOString(),
    dataMode: "connection-registry",
    profile: input.profile,
    discoverySource: "connection-registry:cockpit",
    designLanguage: "g4-cockpit",
  };
}
