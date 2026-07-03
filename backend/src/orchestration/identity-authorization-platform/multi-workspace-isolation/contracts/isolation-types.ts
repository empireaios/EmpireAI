/**
 * G8-08 — Multi-Workspace & Customer Isolation types.
 */

import { z } from "zod";

export const MULTI_WORKSPACE_ISOLATION_VERSION = "g8-08-v1" as const;

export const VISIBILITY_SCOPES = [
  "private_to_account_holder",
  "workspace_visible",
  "company_visible",
  "brand_visible",
  "operator_visible",
  "grand_king_visible",
  "pillow_governed",
  "system_internal",
  "future_scope",
] as const;

export type VisibilityScope = (typeof VISIBILITY_SCOPES)[number];

export const ACCESS_DECISIONS = [
  "allow",
  "deny",
  "requires_approval",
  "requires_delegation",
  "requires_pillow_review",
  "unknown",
] as const;

export type AccessDecision = (typeof ACCESS_DECISIONS)[number];

export const ISOLATION_EKLS_KINDS = [
  "isolation_check_passed",
  "isolation_check_failed",
  "visibility_scope_changed",
  "delegation_created",
  "delegation_revoked",
  "unauthorized_access_blocked",
] as const;

export type IsolationEklsKind = (typeof ISOLATION_EKLS_KINDS)[number];

export type IdentityIsolationObject = {
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  providerId?: string;
  connectionId?: string;
  visibilityScope: VisibilityScope;
  accessPolicy: string;
  ownerReference: string;
  delegationState: "none" | "delegated" | "revoked";
  governanceState: "pillow-governed";
  createdAt: string;
  updatedAt: string;
  correlationId: string;
};

export type IsolationCheckResult = {
  accessDecision: AccessDecision;
  visibilityScope: VisibilityScope;
  allowed: boolean;
  reason: string;
  workspaceBoundary: boolean;
  accountHolderBoundary: boolean;
  providerVisibility: boolean;
  credentialVisibility: boolean;
  governanceState: "pillow-governed";
  correlationId: string;
};

export type IsolationActorContext = {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  accountHolderTypeId?: string;
  companyId?: string;
  brandId?: string;
  environment?: "sandbox" | "production";
  visibilityScope?: VisibilityScope;
  pillowGovernance: true;
};

export const isolationPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "isolation_policy",
    "delegation_validator",
    "visibility_provider",
    "account_holder_mapper",
    "workspace_mapper",
  ]),
  pillowGovernance: z.literal(true),
});

export type IsolationPluginManifest = z.infer<typeof isolationPluginManifestSchema>;

const SECRET_PATTERNS = ["sk_live", "sk_test", "api_key", "secret", "token", "password", "client_secret", "vaultPath"];

export function redactIsolationSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((p) => lower.includes(p))) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) return value.map(redactIsolationSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_PATTERNS.some((p) => k.toLowerCase().includes(p)) ? "[REDACTED]" : redactIsolationSecrets(v),
      ]),
    );
  }
  return value;
}

export function assertNoSecretsInIsolationPayload(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !SECRET_PATTERNS.some((p) => serialized.toLowerCase().includes(p) && !serialized.includes("[REDACTED]"));
}
