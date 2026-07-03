/**
 * G8-07 — Token lifecycle & reauthorization types.
 */

import { z } from "zod";

export const AUTOMATIC_REAUTHORIZATION_VERSION = "g8-07-v1" as const;

export const TOKEN_LIFECYCLE_STATES = [
  "active",
  "expiring_soon",
  "expired",
  "refresh_required",
  "refreshing",
  "refresh_failed",
  "reconnect_required",
  "reauthorization_pending",
  "reauthorized",
  "revoked",
  "suspended",
  "invalid",
  "unknown",
] as const;

export type TokenLifecycleState = (typeof TOKEN_LIFECYCLE_STATES)[number];

export const REAUTHORIZATION_REASONS = [
  "token_expiring",
  "token_expired",
  "refresh_required",
  "refresh_failed",
  "permission_revoked",
  "provider_reconnect",
  "credential_rotation",
  "manual_reconnect",
  "future_reason",
] as const;

export type ReauthorizationReason = (typeof REAUTHORIZATION_REASONS)[number];

export const TOKEN_LIFECYCLE_EKLS_KINDS = [
  "token_expiring_soon",
  "token_expired",
  "reauthorization_requested",
  "reauthorization_completed",
  "reauthorization_failed",
  "token_revoked",
  "refresh_attempted",
  "refresh_blocked",
] as const;

export type TokenLifecycleEklsKind = (typeof TOKEN_LIFECYCLE_EKLS_KINDS)[number];

export type ReauthorizationRequest = {
  reauthorizationId: string;
  connectionId: string;
  providerId: string;
  authorizationId: string;
  credentialRefId: string | null;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  reason: ReauthorizationReason;
  lifecycleState: TokenLifecycleState;
  requiredAction: string;
  expiry: string | null;
  warningWindow: string | null;
  refreshEligible: boolean;
  requiresUserAction: boolean;
  requiresPillowApproval: boolean;
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: "pillow-governed";
};

export type TokenLifecycleSummary = {
  workspaceId: string;
  totalConnections: number;
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  reconnectRequiredCount: number;
  reauthorizationPendingCount: number;
  revokedCount: number;
  computedAt: string;
  correlationId: string;
  governanceState: "pillow-governed";
};

export type TokenLifecycleDetail = {
  providerId: string;
  connectionId: string;
  authorizationId: string | null;
  credentialRefId: string | null;
  lifecycleState: TokenLifecycleState;
  expiry: string | null;
  warningWindow: string | null;
  refreshEligible: boolean;
  requiredAction: string;
  requiresUserAction: boolean;
  requiresPillowApproval: boolean;
  registryRefs: string[];
  governanceState: "pillow-governed";
};

export const tokenLifecyclePluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "refresh_provider",
    "reauthorization_provider",
    "expiry_evaluator",
    "token_validator",
    "reconnect_handler",
    "notification_provider",
  ]),
  pillowGovernance: z.literal(true),
});

export type TokenLifecyclePluginManifest = z.infer<typeof tokenLifecyclePluginManifestSchema>;

const SECRET_PATTERNS = [
  "sk_live",
  "sk_test",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "token",
  "password",
  "client_secret",
  "private_key",
  "bearer",
];

export function redactTokenLifecycleSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((p) => lower.includes(p))) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) return value.map(redactTokenLifecycleSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SECRET_PATTERNS.some((p) => k.toLowerCase().includes(p)) ? "[REDACTED]" : redactTokenLifecycleSecrets(v),
      ]),
    );
  }
  return value;
}

export function assertNoSecretsInTokenLifecyclePayload(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !SECRET_PATTERNS.some((p) => serialized.toLowerCase().includes(p) && !serialized.includes("[REDACTED]"));
}
