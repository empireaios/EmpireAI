import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { CredentialType, CredentialVaultRecord } from "../models/reality-integration.js";

let repositoryInstance: SqliteCredentialVaultRepository | null = null;

export function getCredentialVaultRepository(): SqliteCredentialVaultRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteCredentialVaultRepository();
  }
  return repositoryInstance;
}

export function resetCredentialVaultRepository(): void {
  repositoryInstance = null;
}

function getVaultKey(): Buffer {
  const secret =
    process.env.CREDENTIAL_VAULT_KEY ??
    process.env.JWT_SECRET ??
    "empire-dev-vault-key-not-for-production";
  return scryptSync(secret, "empire-credential-vault-v1", 32);
}

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", getVaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, "base64");
  const iv = buffer.subarray(0, 16);
  const tag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = createDecipheriv("aes-256-gcm", getVaultKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export class CredentialVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialVaultError";
  }
}

export class SqliteCredentialVaultRepository {
  storeCredential(input: {
    workspaceId: string;
    providerId: string;
    credentialType: CredentialType;
    secretPayload: Record<string, unknown>;
    scopes?: string[];
    expiresAt?: string | null;
  }): CredentialVaultRecord {
    const db = getDatabase();
    const credentialsRef = `vault:${input.providerId}:${randomUUID()}`;
    const now = new Date().toISOString();
    const encryptedPayload = encrypt(JSON.stringify(input.secretPayload));

    db.prepare(
      `INSERT INTO credential_vault
        (credentials_ref, workspace_id, provider_id, credential_type, encrypted_payload, scopes_json, expires_at, rotated_at, revoked, created_at)
       VALUES
        (@credentialsRef, @workspaceId, @providerId, @credentialType, @encryptedPayload, @scopesJson, @expiresAt, @rotatedAt, 0, @createdAt)`,
    ).run({
      credentialsRef,
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      credentialType: input.credentialType,
      encryptedPayload,
      scopesJson: JSON.stringify(input.scopes ?? []),
      expiresAt: input.expiresAt ?? null,
      rotatedAt: now,
      createdAt: now,
    });

    return {
      credentialsRef,
      workspaceId: input.workspaceId,
      providerId: input.providerId,
      credentialType: input.credentialType,
      scopes: input.scopes ?? [],
      expiresAt: input.expiresAt ?? null,
      rotatedAt: now,
      revoked: false,
      createdAt: now,
    };
  }

  getRecord(credentialsRef: string): CredentialVaultRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM credential_vault WHERE credentials_ref = @credentialsRef AND revoked = 0`)
      .get({ credentialsRef }) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      credentialsRef: String(row.credentials_ref),
      workspaceId: String(row.workspace_id),
      providerId: String(row.provider_id),
      credentialType: String(row.credential_type) as CredentialType,
      scopes: JSON.parse(String(row.scopes_json)) as string[],
      expiresAt: row.expires_at ? String(row.expires_at) : null,
      rotatedAt: String(row.rotated_at),
      revoked: false,
      createdAt: String(row.created_at),
    };
  }

  resolveSecret(credentialsRef: string): Record<string, unknown> | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT encrypted_payload FROM credential_vault WHERE credentials_ref = @credentialsRef AND revoked = 0`)
      .get({ credentialsRef }) as { encrypted_payload: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(decrypt(row.encrypted_payload)) as Record<string, unknown>;
    } catch {
      throw new CredentialVaultError(`Failed to decrypt credentials: ${credentialsRef}`);
    }
  }

  rotateCredential(credentialsRef: string, newSecretPayload: Record<string, unknown>): CredentialVaultRecord {
    const existing = this.getRecord(credentialsRef);
    if (!existing) throw new CredentialVaultError(`Credential not found: ${credentialsRef}`);
    this.revokeCredential(credentialsRef);
    return this.storeCredential({
      workspaceId: existing.workspaceId,
      providerId: existing.providerId,
      credentialType: existing.credentialType,
      secretPayload: newSecretPayload,
      scopes: existing.scopes,
      expiresAt: existing.expiresAt,
    });
  }

  revokeCredential(credentialsRef: string): void {
    const db = getDatabase();
    db.prepare(`UPDATE credential_vault SET revoked = 1 WHERE credentials_ref = @credentialsRef`).run({
      credentialsRef,
    });
  }

  listByWorkspace(workspaceId: string): CredentialVaultRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(`SELECT * FROM credential_vault WHERE workspace_id = @workspaceId AND revoked = 0`)
      .all({ workspaceId }) as Record<string, unknown>[];
    return rows.map((row) => ({
      credentialsRef: String(row.credentials_ref),
      workspaceId: String(row.workspace_id),
      providerId: String(row.provider_id),
      credentialType: String(row.credential_type) as CredentialType,
      scopes: JSON.parse(String(row.scopes_json)) as string[],
      expiresAt: row.expires_at ? String(row.expires_at) : null,
      rotatedAt: String(row.rotated_at),
      revoked: false,
      createdAt: String(row.created_at),
    }));
  }

  isExpired(credentialsRef: string): boolean {
    const record = this.getRecord(credentialsRef);
    if (!record?.expiresAt) return false;
    return new Date(record.expiresAt).getTime() < Date.now();
  }
}

export function storeConnectorCredential(
  workspaceId: string,
  providerId: string,
  credentialType: CredentialType,
  secretPayload: Record<string, unknown>,
  scopes: string[] = [],
): CredentialVaultRecord {
  return getCredentialVaultRepository().storeCredential({
    workspaceId,
    providerId,
    credentialType,
    secretPayload,
    scopes,
    expiresAt: credentialType === "oauth" || credentialType === "refresh_token"
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      : null,
  });
}
