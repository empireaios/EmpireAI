import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  CredentialGovernanceRecord,
  CredentialGovernanceSummary,
  CredentialVerificationResult,
} from "../models/credential-governance.js";
import type { CredentialType } from "../models/reality-integration.js";
import { getCredentialVaultRepository } from "../repositories/sqlite-credential-vault-repository.js";

const ROTATION_THRESHOLD_DAYS = 75;
const EXPIRY_WARNING_DAYS = 7;

/** REAL-004 — Credential Governance (extends vault, no duplication). */
export function recordCredentialGovernanceEvent(input: {
  credentialsRef: string;
  workspaceId: string;
  providerId: string;
  event: CredentialGovernanceRecord["event"];
  actor: string;
  scopes?: string[];
  expiresAt?: string | null;
  verified?: boolean;
}): CredentialGovernanceRecord {
  const db = getDatabase();
  const record: CredentialGovernanceRecord = {
    eventId: randomUUID(),
    credentialsRef: input.credentialsRef,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    event: input.event,
    actor: input.actor,
    scopes: input.scopes ?? [],
    expiresAt: input.expiresAt ?? null,
    verified: input.verified ?? false,
    recordedAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO credential_vault_audit
      (event_id, credentials_ref, workspace_id, provider_id, event, actor, scopes_json, expires_at, verified, recorded_at)
     VALUES
      (@eventId, @credentialsRef, @workspaceId, @providerId, @event, @actor, @scopesJson, @expiresAt, @verified, @recordedAt)`,
  ).run({
    eventId: record.eventId,
    credentialsRef: record.credentialsRef,
    workspaceId: record.workspaceId,
    providerId: record.providerId,
    event: record.event,
    actor: record.actor,
    scopesJson: JSON.stringify(record.scopes),
    expiresAt: record.expiresAt,
    verified: record.verified ? 1 : 0,
    recordedAt: record.recordedAt,
  });

  return record;
}

export function verifyCredential(credentialsRef: string, actor = "system"): CredentialVerificationResult {
  const vault = getCredentialVaultRepository();
  const record = vault.getRecord(credentialsRef);
  const now = new Date().toISOString();

  if (!record) {
    return {
      credentialsRef,
      providerId: "unknown",
      credentialType: "api_key",
      verified: false,
      expired: true,
      scopesValid: false,
      rotationDue: false,
      reason: "Credential not found or revoked",
      verifiedAt: now,
    };
  }

  const expired = vault.isExpired(credentialsRef);
  const rotatedAt = new Date(record.rotatedAt);
  const rotationDue = (Date.now() - rotatedAt.getTime()) / 86400000 > ROTATION_THRESHOLD_DAYS;
  const scopesValid = record.scopes.length > 0 || record.credentialType === "api_key";
  const verified = !expired && scopesValid && !rotationDue;

  recordCredentialGovernanceEvent({
    credentialsRef,
    workspaceId: record.workspaceId,
    providerId: record.providerId,
    event: verified ? "verified" : expired ? "expired" : "audit_check",
    actor,
    scopes: record.scopes,
    expiresAt: record.expiresAt,
    verified,
  });

  return {
    credentialsRef,
    providerId: record.providerId,
    credentialType: record.credentialType as CredentialType,
    verified,
    expired,
    scopesValid,
    rotationDue,
    reason: expired
      ? "Credential expired"
      : rotationDue
        ? "Rotation recommended (>75 days since last rotation)"
        : verified
          ? "Credential verified"
          : "Scope validation incomplete",
    verifiedAt: now,
  };
}

export function buildCredentialGovernanceSummary(workspaceId: string): CredentialGovernanceSummary {
  const vault = getCredentialVaultRepository();
  const credentials = vault.listByWorkspace(workspaceId);
  const db = getDatabase();

  const auditRows = db
    .prepare(
      `SELECT * FROM credential_vault_audit WHERE workspace_id = @workspaceId ORDER BY recorded_at DESC LIMIT 50`,
    )
    .all({ workspaceId }) as Record<string, unknown>[];

  const now = Date.now();
  let expiringWithin7Days = 0;
  let expiredCredentials = 0;
  let verifiedCredentials = 0;
  let pendingVerification = 0;
  let rotationRecommended = 0;

  for (const cred of credentials) {
    if (cred.expiresAt) {
      const daysRemaining = (new Date(cred.expiresAt).getTime() - now) / 86400000;
      if (daysRemaining <= 0) expiredCredentials++;
      else if (daysRemaining <= EXPIRY_WARNING_DAYS) expiringWithin7Days++;
    }
    const rotatedDays = (now - new Date(cred.rotatedAt).getTime()) / 86400000;
    if (rotatedDays > ROTATION_THRESHOLD_DAYS) rotationRecommended++;
    const verification = verifyCredential(cred.credentialsRef);
    if (verification.verified) verifiedCredentials++;
    else pendingVerification++;
  }

  const revokedCount = (db
    .prepare(`SELECT COUNT(*) as cnt FROM credential_vault WHERE workspace_id = @workspaceId AND revoked = 1`)
    .get({ workspaceId }) as { cnt: number }).cnt;

  const records: CredentialGovernanceRecord[] = auditRows.map((row) => ({
    eventId: String(row.event_id),
    credentialsRef: String(row.credentials_ref),
    workspaceId: String(row.workspace_id),
    providerId: String(row.provider_id),
    event: String(row.event) as CredentialGovernanceRecord["event"],
    actor: String(row.actor),
    scopes: JSON.parse(String(row.scopes_json)) as string[],
    expiresAt: row.expires_at ? String(row.expires_at) : null,
    verified: Boolean(row.verified),
    recordedAt: String(row.recorded_at),
  }));

  return {
    workspaceId,
    totalCredentials: credentials.length + revokedCount,
    activeCredentials: credentials.length,
    expiringWithin7Days,
    expiredCredentials,
    revokedCredentials: revokedCount,
    verifiedCredentials,
    pendingVerification,
    rotationRecommended,
    records,
    computedAt: new Date().toISOString(),
  };
}

export function listExpiringCredentials(workspaceId: string, withinDays = 7): Array<{
  credentialsRef: string;
  providerId: string;
  expiresAt: string;
  daysRemaining: number;
}> {
  const vault = getCredentialVaultRepository();
  const now = Date.now();

  return vault
    .listByWorkspace(workspaceId)
    .filter((c) => c.expiresAt)
    .map((c) => ({
      credentialsRef: c.credentialsRef,
      providerId: c.providerId,
      expiresAt: c.expiresAt!,
      daysRemaining: Math.max(0, Math.ceil((new Date(c.expiresAt!).getTime() - now) / 86400000)),
    }))
    .filter((c) => c.daysRemaining <= withinDays)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export function resetCredentialGovernanceAudit(): void {
  const db = getDatabase();
  db.prepare(`DELETE FROM credential_vault_audit`).run();
}
