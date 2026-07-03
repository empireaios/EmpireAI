/**
 * G8-03 — Credential vault EKLS integration (non-secret audit records only).
 */

import { randomUUID } from "node:crypto";
import {
  CREDENTIAL_VAULT_EKLS_KINDS,
  type CredentialVaultEklsKind,
} from "../contracts/credential-vault-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateCredentialVaultPillowGovernance } from "../governance/credential-vault-pillow-governance.js";
import {
  appendCredentialVaultObservation,
  searchCredentialVaultObservations,
} from "./credential-vault-observation-store.js";

export function recordCredentialVaultEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  credentialRefId?: string;
  providerId?: string;
  kind: CredentialVaultEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateCredentialVaultPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    operation: "handoff",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "credential-vault-integration",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(CREDENTIAL_VAULT_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown credential vault EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendCredentialVaultObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    credentialRefId: input.credentialRefId,
    providerId: input.providerId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Credential vault EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchCredentialVaultEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  credentialRefId?: string;
  providerId?: string;
  kind?: CredentialVaultEklsKind;
  pillowGovernance: true;
}) {
  return searchCredentialVaultObservations(input);
}

export function listCredentialVaultEklsKinds(): readonly CredentialVaultEklsKind[] {
  return CREDENTIAL_VAULT_EKLS_KINDS;
}
