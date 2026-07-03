/**
 * G8-03 — Credential metadata service (rotation, expiry, health).
 */

import type {
  CredentialExpiryMetadata,
  CredentialHealthMetadata,
  CredentialReference,
  CredentialRotationMetadata,
} from "../contracts/credential-vault-types.js";
import { listCredentialVaultPluginsByKind } from "../plugins/credential-vault-plugin-host.js";

export function buildRotationMetadata(ref: CredentialReference): CredentialRotationMetadata {
  const rotationProviders = listCredentialVaultPluginsByKind("rotation_provider");
  const policyMatched = rotationProviders.some((plugin) => plugin.pluginId.includes(ref.rotationPolicy));
  return {
    credentialRefId: ref.credentialRefId,
    rotationPolicy: ref.rotationPolicy,
    lastRotatedAt: ref.lastRotatedAt,
    nextRotationDue: policyMatched ? null : null,
    rotationRequired: policyMatched && ref.status === "rotation_pending",
  };
}

export function buildExpiryMetadata(ref: CredentialReference): CredentialExpiryMetadata {
  const expired = ref.expiresAt ? new Date(ref.expiresAt) < new Date() : false;
  const daysUntilExpiry =
    ref.expiresAt && !expired
      ? Math.ceil((new Date(ref.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : ref.expiresAt
        ? 0
        : null;
  return {
    credentialRefId: ref.credentialRefId,
    expiresAt: ref.expiresAt,
    expired,
    daysUntilExpiry,
  };
}

export function buildHealthMetadata(ref: CredentialReference): CredentialHealthMetadata {
  const healthVerifiers = listCredentialVaultPluginsByKind("health_verifier");
  const expired = ref.expiresAt ? new Date(ref.expiresAt) < new Date() : false;
  let healthStatus: CredentialHealthMetadata["healthStatus"] = "unknown";
  if (ref.status === "revoked") healthStatus = "missing";
  else if (expired) healthStatus = "expired";
  else if (ref.status === "active" && ref.lastVerifiedAt) healthStatus = "healthy";
  else if (ref.status === "active") healthStatus = "degraded";

  if (healthVerifiers.length > 0 && ref.healthStatus === "healthy") {
    healthStatus = "healthy";
  }

  return {
    credentialRefId: ref.credentialRefId,
    healthStatus,
    lastVerifiedAt: ref.lastVerifiedAt,
    verificationPassed: healthStatus === "healthy",
  };
}

export function deriveDefaultExpiry(): string | null {
  return null;
}
