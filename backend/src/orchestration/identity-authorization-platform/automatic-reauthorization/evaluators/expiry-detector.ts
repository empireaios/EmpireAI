/**
 * G8-07 — Expiry detection evaluator.
 */

import type { TokenLifecycleState } from "../contracts/token-lifecycle-types.js";
import { buildExpiryMetadata } from "../../credential-vault-integration/services/credential-metadata-service.js";
import type { CredentialReference } from "../../credential-vault-integration/contracts/credential-vault-types.js";
import type { AuthorizationRequest } from "../../authorization-framework/contracts/authorization-framework-types.js";
import {
  resolveTokenLifecycleProfile,
  resolveWarningWindowMs,
} from "../registry/token-lifecycle-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";

export type ExpiryDetectionResult = {
  lifecycleState: TokenLifecycleState;
  expiry: string | null;
  warningWindow: string | null;
  reason: string;
  evidence: string[];
};

export function detectTokenExpiry(input: {
  providerId: string;
  workspaceId: string;
  authorization?: AuthorizationRequest;
  credentialRef?: CredentialReference;
  context?: RegistryLoaderContext;
}): ExpiryDetectionResult {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const profile = resolveTokenLifecycleProfile(input.providerId, ctx);
  const evidence: string[] = [`provider:${input.providerId}`];

  if (input.authorization?.flowState === "revoked") {
    return {
      lifecycleState: "revoked",
      expiry: input.authorization.expiresAt,
      warningWindow: null,
      reason: "authorization_revoked",
      evidence: [...evidence, "authorization:revoked"],
    };
  }

  if (input.authorization?.flowState === "expired") {
    return {
      lifecycleState: "expired",
      expiry: input.authorization.expiresAt,
      warningWindow: null,
      reason: "authorization_expired",
      evidence: [...evidence, "authorization:expired"],
    };
  }

  const authExpiry = input.authorization?.expiresAt ?? null;
  const credExpiry = input.credentialRef ? buildExpiryMetadata(input.credentialRef) : null;
  const expiry = authExpiry ?? credExpiry?.expiresAt ?? null;
  const now = Date.now();

  if (credExpiry?.expired || (authExpiry && new Date(authExpiry).getTime() < now)) {
    return {
      lifecycleState: "expired",
      expiry,
      warningWindow: null,
      reason: "token_expired",
      evidence: [...evidence, ...(profile?.expiryPolicyRef ? [`expiry-policy:${profile.expiryPolicyRef}`] : [])],
    };
  }

  if (profile && expiry) {
    const warningMs = resolveWarningWindowMs(profile);
    const expiryMs = new Date(expiry).getTime();
    if (warningMs !== null && expiryMs - now <= warningMs) {
      return {
        lifecycleState: "expiring_soon",
        expiry,
        warningWindow: new Date(expiryMs - warningMs).toISOString(),
        reason: "token_expiring",
        evidence: [...evidence, `warning-window-ms:${warningMs}`],
      };
    }
  }

  if (input.authorization?.flowState === "partially_authorized") {
    return {
      lifecycleState: "invalid",
      expiry,
      warningWindow: null,
      reason: "authorization_incomplete",
      evidence: [...evidence, "authorization:partial"],
    };
  }

  if (input.authorization?.flowState === "authorized" && input.credentialRef?.status === "active") {
    return {
      lifecycleState: "active",
      expiry,
      warningWindow: profile ? resolveWarningWindowMs(profile) !== null ? expiry : null : null,
      reason: "token_active",
      evidence: [...evidence, "credential:active"],
    };
  }

  if (profile?.supportsRefreshToken && input.authorization?.flowState === "authorized" && credExpiry?.daysUntilExpiry === 0) {
    return {
      lifecycleState: "refresh_required",
      expiry,
      warningWindow: null,
      reason: "refresh_required",
      evidence: [...evidence, "refresh:required"],
    };
  }

  return {
    lifecycleState: "unknown",
    expiry,
    warningWindow: null,
    reason: "lifecycle_unknown",
    evidence,
  };
}
