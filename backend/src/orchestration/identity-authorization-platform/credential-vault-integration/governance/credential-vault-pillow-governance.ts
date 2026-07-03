/**
 * G8-03 — Credential Vault Pillow governance.
 */

import { VAULT_CREDENTIAL_TYPES } from "../contracts/credential-vault-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { resolveProviderCredentialRequirements } from "../registry/credential-vault-resolver.js";

export type CredentialVaultPillowContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  credentialType?: string;
  vaultBackend?: string;
  rotationPolicy?: string;
  operation: "handoff" | "list" | "verify" | "rotate" | "revoke" | "health";
  pillowGovernance: true;
};

export type CredentialVaultPillowResult = {
  allowed: boolean;
  reason: string;
  workspaceOwnership: boolean;
  accountHolderAuthority: boolean;
  providerEligibility: boolean;
  credentialTypeEligibility: boolean;
  vaultBackendEligibility: boolean;
  rotationPolicyValid: boolean;
  permissionBoundary: boolean;
  securityPolicy: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): CredentialVaultPillowResult {
  return {
    allowed: false,
    reason,
    workspaceOwnership: false,
    accountHolderAuthority: false,
    providerEligibility: false,
    credentialTypeEligibility: false,
    vaultBackendEligibility: false,
    rotationPolicyValid: false,
    permissionBoundary: false,
    securityPolicy: false,
    eklsGoverned: false,
  };
}

export function validateCredentialVaultPillowGovernance(
  context: CredentialVaultPillowContext,
): CredentialVaultPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no credential vault bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }
  if (context.ownerId !== "grand-king" && context.operation !== "list") {
    return deny("Workspace ownership validation failed");
  }

  let providerEligibility = true;
  let credentialTypeEligibility = true;
  let vaultBackendEligibility = true;
  let rotationPolicyValid = true;

  if (context.providerId) {
    const requirements = resolveProviderCredentialRequirements(context.providerId, {
      workspaceId: context.workspaceId,
    });
    providerEligibility = requirements !== undefined;
    if (!providerEligibility) {
      return {
        ...deny(`Provider eligibility failed — ${context.providerId}`),
        workspaceOwnership: true,
        accountHolderAuthority: !!context.accountHolderId,
      };
    }

    if (context.credentialType) {
      credentialTypeEligibility = (VAULT_CREDENTIAL_TYPES as readonly string[]).includes(context.credentialType);
    }
    if (context.vaultBackend) {
      vaultBackendEligibility = context.vaultBackend === requirements!.vaultBackend;
    }
    if (context.rotationPolicy) {
      rotationPolicyValid = context.rotationPolicy === requirements!.rotationPolicyRef;
    }
    if (!credentialTypeEligibility || !vaultBackendEligibility || !rotationPolicyValid) {
      return {
        ...deny("Credential type, vault backend, or rotation policy validation failed"),
        workspaceOwnership: true,
        accountHolderAuthority: true,
        providerEligibility: true,
        credentialTypeEligibility,
        vaultBackendEligibility,
        rotationPolicyValid,
        securityPolicy: true,
      };
    }
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      consumerChannel: "credential-vault-integration",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      workspaceOwnership: true,
      accountHolderAuthority: !!context.accountHolderId,
      providerEligibility,
      credentialTypeEligibility,
      vaultBackendEligibility,
      rotationPolicyValid,
      permissionBoundary: true,
      securityPolicy: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Credential vault Pillow governance passed",
    workspaceOwnership: true,
    accountHolderAuthority: true,
    providerEligibility,
    credentialTypeEligibility,
    vaultBackendEligibility,
    rotationPolicyValid,
    permissionBoundary: true,
    securityPolicy: true,
    eklsGoverned: true,
  };
}
