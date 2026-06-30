import type { CredentialVaultProfile } from "../models/credential-vault-profile.js";
import { getApprovalPolicy } from "./approval-framework-service.js";
import { getCredentialVaultRepository } from "../repositories/sqlite-credential-vault-repository.js";
import { getDatabase } from "../../../brain/database.js";

/** REAL-002A — Credential vault profile via existing governance store (no duplicate vault). */
export function buildCredentialVaultProfile(credentialsRef: string): CredentialVaultProfile | null {
  const vault = getCredentialVaultRepository();
  const record = vault.getRecord(credentialsRef);
  if (!record) return null;

  const db = getDatabase();
  const lastVerified = db.prepare(
    `SELECT recorded_at FROM credential_vault_audit
     WHERE credentials_ref = @credentialsRef AND event = 'verified'
     ORDER BY recorded_at DESC LIMIT 1`,
  ).get({ credentialsRef }) as { recorded_at: string } | undefined;

  const lastOwner = db.prepare(
    `SELECT actor FROM credential_vault_audit
     WHERE credentials_ref = @credentialsRef AND event = 'stored'
     ORDER BY recorded_at DESC LIMIT 1`,
  ).get({ credentialsRef }) as { actor: string } | undefined;

  const policy = getApprovalPolicy("activate_runtime");
  const expired = vault.isExpired(credentialsRef);
  const rotatedAt = new Date(record.rotatedAt).getTime();
  const rotationDue = Date.now() - rotatedAt > 75 * 24 * 60 * 60 * 1000;

  let refreshStatus: CredentialVaultProfile["refreshStatus"] = "NOT_REQUIRED";
  if (record.credentialType === "oauth" || record.credentialType === "refresh_token") {
    if (expired) refreshStatus = "FAILED";
    else if (rotationDue) refreshStatus = "DUE";
    else refreshStatus = "VALID";
  }

  return {
    credentialsRef: record.credentialsRef,
    providerId: record.providerId,
    account: null,
    credentialType: record.credentialType,
    scopes: record.scopes,
    permissions: record.scopes,
    expiresAt: record.expiresAt,
    refreshStatus,
    verifiedAt: lastVerified?.recorded_at ?? null,
    owner: lastOwner?.actor ?? null,
    approvalPolicy: policy ? `approval-${policy.action}` : "activate_runtime",
    revoked: record.revoked,
  };
}

export function listCredentialVaultProfiles(workspaceId: string): CredentialVaultProfile[] {
  return getCredentialVaultRepository()
    .listByWorkspace(workspaceId)
    .map((r) => buildCredentialVaultProfile(r.credentialsRef))
    .filter((p): p is CredentialVaultProfile => p !== null);
}
