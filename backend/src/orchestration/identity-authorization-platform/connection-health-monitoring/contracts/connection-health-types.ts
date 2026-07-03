/**
 * G8-04 — Connection Health & Monitoring types.
 */

import { z } from "zod";

export const CONNECTION_HEALTH_MONITORING_VERSION = "g8-04-v1" as const;

export const CONNECTION_HEALTH_STATES = [
  "healthy",
  "degraded",
  "warning",
  "expired",
  "revoked",
  "failed",
  "unavailable",
  "misconfigured",
  "missing_credentials",
  "missing_permissions",
  "requires_reconnect",
  "requires_review",
  "unknown",
] as const;

export type ConnectionHealthState = (typeof CONNECTION_HEALTH_STATES)[number];

export const HEALTH_CHECK_TYPES = [
  "credential_present",
  "credential_expiry",
  "authorization_status",
  "scope_completeness",
  "permission_completeness",
  "webhook_status",
  "provider_availability",
  "sandbox_status",
  "production_status",
  "readiness_status",
  "manual_review",
  "future_check_type",
] as const;

export type HealthCheckType = (typeof HEALTH_CHECK_TYPES)[number];

export const HEALTH_CHECK_SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;

export type HealthCheckSeverity = (typeof HEALTH_CHECK_SEVERITIES)[number];

export const CONNECTION_HEALTH_EKLS_KINDS = [
  "connection_health_checked",
  "connection_health_degraded",
  "connection_health_recovered",
  "connection_expired",
  "connection_revoked",
  "connection_requires_reconnect",
  "connection_monitoring_failed",
] as const;

export type ConnectionHealthEklsKind = (typeof CONNECTION_HEALTH_EKLS_KINDS)[number];

export type ConnectionHealthCheck = {
  healthCheckId: string;
  connectionId: string;
  providerId: string;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  checkType: HealthCheckType;
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  lastCheckedAt: string;
  nextCheckAt: string | null;
  expiry: string | null;
  requiredAction: string | null;
  correlationId: string;
  governanceState: string;
};

export type ConnectionHealthSummary = {
  workspaceId: string;
  providerCount: number;
  healthyCount: number;
  degradedCount: number;
  attentionCount: number;
  overallStatus: ConnectionHealthState;
  computedAt: string;
};

export type ProviderHealthMatrixEntry = {
  providerId: string;
  displayName: string;
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  checkCount: number;
  lastCheckedAt: string | null;
};

export type ConnectionHealthAttentionItem = {
  attentionId: string;
  providerId: string;
  connectionId: string;
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  requiredAction: string | null;
};

export const connectionHealthPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "health_check_provider",
    "monitoring_strategy",
    "expiry_evaluator",
    "permission_evaluator",
    "webhook_monitor",
    "provider_availability_check",
  ]),
  pillowGovernance: z.literal(true),
});

export type ConnectionHealthPluginManifest = z.infer<typeof connectionHealthPluginManifestSchema>;

const SECRET_PATTERNS = [
  "sk_live",
  "sk_test",
  "sk-",
  "api_key",
  "apikey",
  "password",
  "secret",
  "token",
  "bearer",
  "refresh",
  "private_key",
  "client_secret",
];

export function redactConnectionHealthSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((pattern) => lower.includes(pattern))) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactConnectionHealthSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        SECRET_PATTERNS.some((p) => key.toLowerCase().includes(p)) ? "[REDACTED]" : redactConnectionHealthSecrets(entry),
      ]),
    );
  }
  return value;
}

export function assertNoSecretsInHealthPayload(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !SECRET_PATTERNS.some((pattern) => serialized.toLowerCase().includes(pattern) && !serialized.includes("[REDACTED]"));
}
