/**
 * G8-09 — Identity & Authorization Plugin Integration contracts.
 */

import { z } from "zod";

export const IDENTITY_PLUGIN_INTEGRATION_VERSION = "g8-09-v1" as const;

export const IDENTITY_PLUGIN_CATEGORIES = [
  "identity_provider_plugin",
  "authorization_provider_plugin",
  "oauth_strategy_plugin",
  "credential_handler_plugin",
  "vault_backend_plugin",
  "health_check_plugin",
  "readiness_rule_plugin",
  "reauthorization_plugin",
  "isolation_policy_plugin",
  "notification_plugin",
  "provider_card_plugin",
  "future_identity_plugin",
] as const;

export type IdentityPluginCategory = (typeof IDENTITY_PLUGIN_CATEGORIES)[number];

export const IDENTITY_PLUGIN_LIFECYCLE_STATES = [
  "discovered",
  "validated",
  "registered",
  "loaded",
  "enabled",
  "disabled",
  "failed",
  "deprecated",
  "retired",
  "unknown",
] as const;

export type IdentityPluginLifecycleState = (typeof IDENTITY_PLUGIN_LIFECYCLE_STATES)[number];

export const IDENTITY_PLUGIN_HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
] as const;

export type IdentityPluginHealthStatus = (typeof IDENTITY_PLUGIN_HEALTH_STATUSES)[number];

export const IDENTITY_PLUGIN_EKLS_KINDS = [
  "identity_plugin_registered",
  "identity_plugin_enabled",
  "identity_plugin_disabled",
  "identity_plugin_failed",
  "identity_plugin_retired",
  "identity_plugin_health_changed",
] as const;

export type IdentityPluginEklsKind = (typeof IDENTITY_PLUGIN_EKLS_KINDS)[number];

export const identityPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginVersion: z.string().min(1),
  pluginOwner: z.string().min(1),
  pluginCategory: z.enum(IDENTITY_PLUGIN_CATEGORIES),
  supportedProviders: z.array(z.string()).default([]),
  supportedConnectionTypes: z.array(z.string()).default([]),
  supportedCredentialTypes: z.array(z.string()).default([]),
  capabilities: z.array(z.string()).min(1),
  requiredPermissions: z.array(z.string()).min(1),
  registryReferences: z.array(z.string()).default([]),
  configurationSchema: z.record(z.unknown()).default({}),
  healthCheck: z
    .object({
      checkType: z.string(),
      intervalMs: z.number().optional(),
    })
    .default({ checkType: "ping" }),
  compatibilityMatrix: z.record(z.unknown()).default({}),
  lifecycleHooks: z.record(z.unknown()).default({}),
  governanceState: z.literal("pillow-governed").default("pillow-governed"),
  pillowGovernance: z.literal(true),
});

export type IdentityPluginManifest = z.infer<typeof identityPluginManifestSchema>;

export type IdentityPluginRecord = IdentityPluginManifest & {
  status: IdentityPluginLifecycleState;
  healthStatus: IdentityPluginHealthStatus;
  workspaceId: string;
  registryBindingIds: string[];
  warnings: string[];
  errors: string[];
  createdAt: string;
  updatedAt: string;
  lastHealthCheckedAt: string | null;
  failureCount: number;
};

export type IdentityPluginRegistrationResult = {
  accepted: boolean;
  pluginId: string;
  lifecycleState: IdentityPluginLifecycleState;
  reason: string;
  registryBindingIds?: string[];
};

export type IdentityPluginValidationResult = {
  pluginId: string;
  valid: boolean;
  lifecycleState: IdentityPluginLifecycleState;
  compatibilityPassed: boolean;
  registryPolicyPassed: boolean;
  governancePassed: boolean;
  reason: string;
  warnings: string[];
};

export type IdentityPluginCapabilitySummary = {
  pluginId: string;
  pluginCategory: IdentityPluginCategory;
  capabilities: string[];
  supportedProviders: string[];
  supportedConnectionTypes: string[];
  supportedCredentialTypes: string[];
  registryBindingIds: string[];
  lifecycleState: IdentityPluginLifecycleState;
  healthStatus: IdentityPluginHealthStatus;
};

export type ResolvedIdentityPluginPolicy = {
  pluginId: string;
  category: IdentityPluginCategory;
  allowed: boolean;
  reason: string;
  connectionProviderIds: string[];
  connectionTypeIds: string[];
  connectionCapabilityIds: string[];
  connectionPolicyIds: string[];
  identityProviderIds: string[];
  authorizationProviderIds: string[];
  identityMonitorIds: string[];
  readinessPolicyIds: string[];
  bindingIds: string[];
};

export type IdentityPluginDiscoveryResult = {
  discoveredCount: number;
  plugins: Array<{
    pluginId: string;
    kind: string;
    version: string;
    targetRegistryId: string;
    registeredAt?: string;
  }>;
  generatedAt: string;
};

const SECRET_PATTERNS = [
  "sk_live",
  "sk_test",
  "api_key",
  "apikey",
  "password",
  "secret",
  "token",
  "bearer",
  "refresh",
  "private_key",
  "client_secret",
  "credential",
  "oauth",
  "vaultpath",
];

export function redactIdentityPluginSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (SECRET_PATTERNS.some((pattern) => lower.includes(pattern))) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactIdentityPluginSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactIdentityPluginSecrets(entry),
      ]),
    );
  }
  return value;
}

export function assertNoSecretsInIdentityPluginPayload(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const pattern of SECRET_PATTERNS) {
    if (serialized.includes(pattern) && !serialized.includes("[redacted]")) {
      throw new Error(`Identity plugin payload must not contain secrets (${pattern})`);
    }
  }
}
