/**
 * G8-03 — Authorization Centre future Cockpit credential contracts.
 */

import type {
  CredentialExpiryMetadata,
  CredentialHealthMetadata,
  CredentialReference,
  CredentialRotationMetadata,
} from "./credential-vault-types.js";
import { buildExpiryMetadata, buildHealthMetadata, buildRotationMetadata } from "../services/credential-metadata-service.js";
import { resolveAllProviderCredentialRequirements } from "../registry/credential-vault-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";

export type CockpitCredentialStatusView = {
  viewId: "cockpit-credential-status";
  computedAt: string;
  dataMode: "credential-vault-integration";
  presentationDeferred: true;
  futureMission: "G8-05";
  references: CredentialReference[];
  missingCredentialWarnings: string[];
  discoverySource: "credential-vault-integration:cockpit";
  designLanguage: "g4-cockpit";
};

export type CockpitCredentialDetailView = {
  viewId: "cockpit-credential-detail";
  computedAt: string;
  reference: CredentialReference;
  expiry: CredentialExpiryMetadata;
  health: CredentialHealthMetadata;
  rotation: CredentialRotationMetadata;
  presentationDeferred: true;
  futureMission: "G8-05";
};

export function buildCockpitCredentialStatusView(context: RegistryLoaderContext = {}): CockpitCredentialStatusView {
  const requirements = resolveAllProviderCredentialRequirements(context);
  const references: CredentialReference[] = [];
  const missingCredentialWarnings = requirements.map(
    (req) => `Missing credential reference for ${req.displayName} (${req.providerId})`,
  );

  return {
    viewId: "cockpit-credential-status",
    computedAt: new Date().toISOString(),
    dataMode: "credential-vault-integration",
    presentationDeferred: true,
    futureMission: "G8-05",
    references,
    missingCredentialWarnings,
    discoverySource: "credential-vault-integration:cockpit",
    designLanguage: "g4-cockpit",
  };
}

export function buildCockpitCredentialDetailView(ref: CredentialReference): CockpitCredentialDetailView {
  return {
    viewId: "cockpit-credential-detail",
    computedAt: new Date().toISOString(),
    reference: ref,
    expiry: buildExpiryMetadata(ref),
    health: buildHealthMetadata(ref),
    rotation: buildRotationMetadata(ref),
    presentationDeferred: true,
    futureMission: "G8-05",
  };
}
