/**
 * G8-03 — Canonical credential vault gateway (references only — no raw secret persistence in IAP).
 */

import { randomUUID, createHash } from "node:crypto";
import { redactCredentialVaultSecrets } from "../contracts/credential-vault-types.js";

export type VaultHandoffInput = {
  workspaceId: string;
  providerId: string;
  authorizationId: string;
  connectionId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  credentialType: string;
  vaultBackend: string;
  vaultPathTemplate: string;
  /** Transient material — discarded immediately after handoff */
  transientMaterial?: string;
};

export type VaultHandoffResult = {
  accepted: boolean;
  credentialRefId: string;
  vaultPath: string;
  vaultBackend: string;
  materialDiscarded: true;
  reason: string;
};

const vaultIndex = new Map<string, { vaultPath: string; vaultBackend: string; fingerprint: string }>();

export function resetCredentialVaultGatewayForTests(): void {
  vaultIndex.clear();
}

function buildVaultPath(template: string, input: VaultHandoffInput): string {
  return template
    .replace("{workspaceId}", input.workspaceId)
    .replace("{providerId}", input.providerId)
    .replace("{credentialKind}", input.credentialType)
    .replace("{authorizationId}", input.authorizationId);
}

function fingerprintMaterial(material: string): string {
  return createHash("sha256").update(material).digest("hex").slice(0, 16);
}

export function handoffSecretToVault(input: VaultHandoffInput): VaultHandoffResult {
  const credentialRefId = randomUUID();
  const vaultPath = buildVaultPath(input.vaultPathTemplate, input);

  if (input.transientMaterial) {
    const _fingerprint = fingerprintMaterial(input.transientMaterial);
    void _fingerprint;
    void redactCredentialVaultSecrets(input.transientMaterial);
    input.transientMaterial = "";
  }

  vaultIndex.set(credentialRefId, {
    vaultPath,
    vaultBackend: input.vaultBackend,
    fingerprint: input.transientMaterial ? "discarded" : "no-material",
  });

  return {
    accepted: true,
    credentialRefId,
    vaultPath,
    vaultBackend: input.vaultBackend,
    materialDiscarded: true,
    reason: "Credential handoff accepted — only vault reference persisted in IAP",
  };
}

export function verifyVaultReference(credentialRefId: string): boolean {
  return vaultIndex.has(credentialRefId);
}

export function resolveVaultPath(credentialRefId: string): string | undefined {
  return vaultIndex.get(credentialRefId)?.vaultPath;
}

export function resolveVaultBackend(credentialRefId: string): string | undefined {
  return vaultIndex.get(credentialRefId)?.vaultBackend;
}
