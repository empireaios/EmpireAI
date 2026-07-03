/**
 * G8-03 — Credential Vault & Secret Management types.
 */

import { z } from "zod";

export const CREDENTIAL_VAULT_INTEGRATION_VERSION = "g8-03-v1" as const;

export const VAULT_CREDENTIAL_TYPES = [
  "api_key",
  "secret_key",
  "publishable_key",
  "refresh_token",
  "access_token",
  "oauth_client_id",
  "oauth_client_secret",
  "lwa_client_id",
  "lwa_client_secret",
  "iam_role",
  "webhook_secret",
  "private_key",
  "public_key",
  "future_credential_type",
] as const;

export type VaultCredentialType = (typeof VAULT_CREDENTIAL_TYPES)[number];

export const CREDENTIAL_REFERENCE_STATUSES = [
  "pending",
  "active",
  "expired",
  "revoked",
  "rotation_pending",
  "verification_failed",
  "unknown",
] as const;

export type CredentialReferenceStatus = (typeof CREDENTIAL_REFERENCE_STATUSES)[number];

export const CREDENTIAL_VAULT_EKLS_KINDS = [
  "credential_reference_created",
  "credential_reference_verified",
  "credential_reference_expired",
  "credential_reference_rotated",
  "credential_reference_revoked",
  "credential_handoff_failed",
] as const;

export type CredentialVaultEklsKind = (typeof CREDENTIAL_VAULT_EKLS_KINDS)[number];

export type CredentialReference = {
  credentialRefId: string;
  providerId: string;
  connectionId: string;
  authorizationId: string;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  credentialType: VaultCredentialType;
  vaultBackend: string;
  vaultPath: string;
  status: CredentialReferenceStatus;
  expiresAt: string | null;
  lastRotatedAt: string | null;
  lastVerifiedAt: string | null;
  rotationPolicy: string;
  healthStatus: string;
  readinessStatus: string;
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type CredentialHandoffPreview = {
  accepted: boolean;
  credentialRefId?: string;
  vaultPath?: string;
  vaultBackend: string;
  secretRedacted: true;
  materialDiscarded: true;
  reason: string;
};

export type CredentialRotationMetadata = {
  credentialRefId: string;
  rotationPolicy: string;
  lastRotatedAt: string | null;
  nextRotationDue: string | null;
  rotationRequired: boolean;
};

export type CredentialExpiryMetadata = {
  credentialRefId: string;
  expiresAt: string | null;
  expired: boolean;
  daysUntilExpiry: number | null;
};

export type CredentialHealthMetadata = {
  credentialRefId: string;
  healthStatus: "healthy" | "degraded" | "expired" | "missing" | "unknown";
  lastVerifiedAt: string | null;
  verificationPassed: boolean;
};

export const credentialVaultPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "credential_validator",
    "credential_mapper",
    "vault_backend",
    "rotation_provider",
    "health_verifier",
    "redaction_rule",
  ]),
  pillowGovernance: z.literal(true),
});

export type CredentialVaultPluginManifest = z.infer<typeof credentialVaultPluginManifestSchema>;

const SECRET_PATTERNS = [
  "sk_live",
  "sk_test",
  "sk-",
  "api_key",
  "apikey",
  "password",
  "secret",
  "token",
  "credential",
  "oauth",
  "bearer",
  "refresh",
  "private_key",
  "client_secret",
];

export function redactCredentialVaultSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((pattern) => lower.includes(pattern))) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactCredentialVaultSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SECRET_PATTERNS.some((p) => key.toLowerCase().includes(p)) ? "[REDACTED]" : redactCredentialVaultSecrets(entry),
      ]),
    );
  }
  return value;
}

export function assertNoRawSecretsInPayload(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !SECRET_PATTERNS.some((pattern) => serialized.toLowerCase().includes(pattern) && !serialized.includes("[REDACTED]"));
}
