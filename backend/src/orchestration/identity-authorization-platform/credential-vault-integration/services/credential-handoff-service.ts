/**
 * G8-03 — Credential handoff service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  type CredentialHandoffPreview,
  type CredentialReference,
  CREDENTIAL_VAULT_INTEGRATION_VERSION,
  redactCredentialVaultSecrets,
} from "../contracts/credential-vault-types.js";
import { recordCredentialVaultEklsObservation } from "../ekls/credential-vault-ekls-integration.js";
import { validateCredentialVaultPillowGovernance } from "../governance/credential-vault-pillow-governance.js";
import { resolveProviderCredentialRequirements } from "../registry/credential-vault-resolver.js";
import {
  handoffSecretToVault,
  verifyVaultReference,
  type VaultHandoffResult,
} from "../vault/credential-vault-gateway.js";
import {
  buildExpiryMetadata,
  buildHealthMetadata,
  buildRotationMetadata,
  deriveDefaultExpiry,
} from "./credential-metadata-service.js";

const credentialReferences = new Map<string, CredentialReference>();

export function resetCredentialHandoffStateForTests(): void {
  credentialReferences.clear();
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId?: string;
  credentialType?: string;
  vaultBackend?: string;
  rotationPolicy?: string;
  operation: "handoff" | "list" | "verify" | "rotate" | "revoke" | "health";
}) {
  const governance = validateCredentialVaultPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

function persistCredentialReference(input: {
  providerId: string;
  authorizationId: string;
  connectionId: string;
  workspaceId: string;
  accountHolderId: string;
  environment?: "sandbox" | "production";
  requirements: NonNullable<ReturnType<typeof resolveProviderCredentialRequirements>>;
  handoff: VaultHandoffResult;
}): CredentialReference {
  const now = new Date().toISOString();
  const correlationId = randomUUID();
  const ref: CredentialReference = {
    credentialRefId: input.handoff.credentialRefId,
    providerId: input.providerId,
    connectionId: input.connectionId,
    authorizationId: input.authorizationId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    environment: input.environment ?? "production",
    credentialType: input.requirements.credentialKind,
    vaultBackend: input.handoff.vaultBackend,
    vaultPath: input.handoff.vaultPath,
    status: "active",
    expiresAt: deriveDefaultExpiry(),
    lastRotatedAt: now,
    lastVerifiedAt: now,
    rotationPolicy: input.requirements.rotationPolicyRef,
    healthStatus: "healthy",
    readinessStatus: "ready",
    createdAt: now,
    updatedAt: now,
    correlationId,
    governanceState: "pillow-governed",
  };
  credentialReferences.set(ref.credentialRefId, ref);
  return ref;
}

export function createCredentialReference(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  providerId: string;
  authorizationId: string;
  connectionId: string;
  environment?: "sandbox" | "production";
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}): CredentialReference {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const requirements = resolveProviderCredentialRequirements(input.providerId, context);
  if (!requirements) {
    throw new Error(`Credential requirements not found for provider: ${input.providerId}`);
  }

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    credentialType: requirements.credentialKind,
    vaultBackend: requirements.vaultBackend,
    rotationPolicy: requirements.rotationPolicyRef,
    operation: "handoff",
  });

  const handoff = handoffSecretToVault({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    authorizationId: input.authorizationId,
    connectionId: input.connectionId,
    accountHolderId: input.accountHolderId,
    environment: input.environment ?? "production",
    credentialType: requirements.credentialKind,
    vaultBackend: requirements.vaultBackend,
    vaultPathTemplate: requirements.vaultPathTemplate,
  });

  const ref = persistCredentialReference({
    providerId: input.providerId,
    authorizationId: input.authorizationId,
    connectionId: input.connectionId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    environment: input.environment,
    requirements,
    handoff,
  });

  recordCredentialVaultEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    credentialRefId: ref.credentialRefId,
    providerId: input.providerId,
    kind: "credential_reference_created",
    summary: `Credential reference created for ${requirements.displayName} — vault path only`,
    pillowGovernance: true,
  });

  return ref;
}

export function previewCredentialHandoff(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  providerId: string;
  authorizationId: string;
  connectionId: string;
  /** Transient — never persisted */
  transientMaterial?: string;
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}): CredentialHandoffPreview {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const requirements = resolveProviderCredentialRequirements(input.providerId, context);
  if (!requirements) {
    recordCredentialVaultEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      kind: "credential_handoff_failed",
      summary: "Credential handoff failed — provider not in registry",
      pillowGovernance: true,
    });
    return {
      accepted: false,
      vaultBackend: "empire-credential-vault",
      secretRedacted: true,
      materialDiscarded: true,
      reason: "Provider not found in registry",
    };
  }

  try {
    requireGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      credentialType: requirements.credentialKind,
      vaultBackend: requirements.vaultBackend,
      rotationPolicy: requirements.rotationPolicyRef,
      operation: "handoff",
    });
  } catch (err) {
    recordCredentialVaultEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      kind: "credential_handoff_failed",
      summary: err instanceof Error ? err.message : "Governance rejected handoff",
      pillowGovernance: true,
    });
    return {
      accepted: false,
      vaultBackend: requirements.vaultBackend,
      secretRedacted: true,
      materialDiscarded: true,
      reason: err instanceof Error ? err.message : "Governance rejected handoff",
    };
  }

  let transient = input.transientMaterial;
  const handoff = handoffSecretToVault({
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    authorizationId: input.authorizationId,
    connectionId: input.connectionId,
    accountHolderId: input.accountHolderId,
    environment: "production",
    credentialType: requirements.credentialKind,
    vaultBackend: requirements.vaultBackend,
    vaultPathTemplate: requirements.vaultPathTemplate,
    transientMaterial: transient,
  });
  transient = undefined;
  void redactCredentialVaultSecrets(input.transientMaterial);

  const ref = persistCredentialReference({
    providerId: input.providerId,
    authorizationId: input.authorizationId,
    connectionId: input.connectionId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    requirements,
    handoff,
  });

  recordCredentialVaultEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    credentialRefId: ref.credentialRefId,
    providerId: input.providerId,
    kind: "credential_reference_created",
    summary: `Credential handoff preview completed for ${requirements.displayName}`,
    pillowGovernance: true,
  });

  return {
    accepted: handoff.accepted,
    credentialRefId: ref.credentialRefId,
    vaultPath: ref.vaultPath,
    vaultBackend: ref.vaultBackend,
    secretRedacted: true,
    materialDiscarded: true,
    reason: handoff.reason,
  };
}

export function listCredentialReferences(context: RegistryLoaderContext = {}): CredentialReference[] {
  void context;
  return Array.from(credentialReferences.values());
}

export function getCredentialReference(credentialRefId: string): CredentialReference | undefined {
  return credentialReferences.get(credentialRefId);
}

export function getCredentialReferenceDetail(credentialRefId: string) {
  const ref = credentialReferences.get(credentialRefId);
  if (!ref) return undefined;
  return {
    reference: ref,
    rotation: buildRotationMetadata(ref),
    expiry: buildExpiryMetadata(ref),
    health: buildHealthMetadata(ref),
    vaultVerified: verifyVaultReference(credentialRefId),
  };
}

export function verifyCredentialReference(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  credentialRefId: string;
  pillowGovernance: true;
}) {
  const ref = credentialReferences.get(input.credentialRefId);
  if (!ref) throw new Error("Credential reference not found");

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: ref.providerId,
    operation: "verify",
  });

  const verified = verifyVaultReference(input.credentialRefId);
  const now = new Date().toISOString();
  if (verified) {
    ref.lastVerifiedAt = now;
    ref.updatedAt = now;
    credentialReferences.set(input.credentialRefId, ref);
    recordCredentialVaultEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      credentialRefId: input.credentialRefId,
      providerId: ref.providerId,
      kind: "credential_reference_verified",
      summary: "Credential reference verified against vault gateway",
      pillowGovernance: true,
    });
  }

  return { verified, health: buildHealthMetadata(ref) };
}

export function getCredentialRotationStatus(credentialRefId: string) {
  const ref = credentialReferences.get(credentialRefId);
  if (!ref) return undefined;
  return buildRotationMetadata(ref);
}

export function getCredentialHealth(credentialRefId: string) {
  const ref = credentialReferences.get(credentialRefId);
  if (!ref) return undefined;
  return buildHealthMetadata(ref);
}

export function runCredentialRedactionTest(input: unknown) {
  const redacted = redactCredentialVaultSecrets(input);
  const serialized = JSON.stringify(redacted);
  return {
    redacted,
    leaksDetected:
      serialized.includes("sk_live") ||
      serialized.includes("secret_key_value") ||
      serialized.includes("super_secret_token"),
  };
}

export function getCredentialVaultIntegrationVersion() {
  return CREDENTIAL_VAULT_INTEGRATION_VERSION;
}
