/**
 * G8-01 — Connection Registry types and schemas.
 */

import { z } from "zod";
import { PRODUCTION_WORKSPACE_REGISTRY_VERSION } from "./production-workspace-registry-types.js";
import { IDENTITY_AUTHORIZATION_REGISTRY_VERSION } from "./identity-authorization-registry-types.js";

export const CONNECTION_REGISTRY_VERSION = "g8-01-v1" as const;

export const CONNECTION_REGISTRY_PROVIDER_IDS = [
  "amazon",
  "stripe",
  "meta",
  "google",
  "shopify",
  "tiktok",
  "openai",
  "anthropic",
  "github",
  "vercel",
  "cloudflare",
  "cjdropshipping",
  "email-provider",
  "domain-provider",
] as const;

export type ConnectionRegistryProviderId = (typeof CONNECTION_REGISTRY_PROVIDER_IDS)[number];

export const PROVIDER_CATEGORIES = [
  "marketplace",
  "payment",
  "advertising",
  "analytics",
  "storefront",
  "supplier",
  "logistics",
  "ai-provider",
  "developer-platform",
  "hosting-platform",
  "domain-provider",
  "email-provider",
  "future-provider",
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

export const CONNECTION_STATUSES = [
  "not_configured",
  "pending",
  "connected",
  "authorized",
  "partially_authorized",
  "expired",
  "revoked",
  "failed",
  "suspended",
  "requires_review",
  "unknown",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const READINESS_STATES = [
  "ready",
  "not_ready",
  "missing_credentials",
  "missing_permissions",
  "expired",
  "provider_unavailable",
  "requires_reconnect",
  "requires_review",
  "unknown",
] as const;

export type ReadinessState = (typeof READINESS_STATES)[number];

export const CONNECTION_REGISTRY_EKLS_KINDS = [
  "connection_provider_registered",
  "connection_requirement_defined",
  "connection_capability_defined",
  "connection_profile_resolved",
  "connection_registry_validation_failed",
] as const;

export type ConnectionRegistryEklsKind = (typeof CONNECTION_REGISTRY_EKLS_KINDS)[number];

export type ConnectionRegistryRowBase = {
  id: string;
  name: string;
  description: string;
  status: "VALIDATED" | "DRAFT" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
  version: string;
  owner: string;
  dependencies: string[];
  capabilities: string[];
  configuration: Record<string, unknown>;
  supportedRegions: string[];
  supportedCountries: string[];
  validation: { schemaVersion: typeof CONNECTION_REGISTRY_VERSION };
  pluginSupport: { allowPluginRegistration: boolean };
  workspaceScope: { scope: "global" | "workspace" };
  futureCompatibility: { notes: string };
};

const registrySchemaVersion = z.union([
  z.literal(CONNECTION_REGISTRY_VERSION),
  z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  z.literal(IDENTITY_AUTHORIZATION_REGISTRY_VERSION),
]);

export const connectionRegistryProviderConfigurationSchema = z.object({
  schemaVersion: registrySchemaVersion,
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  providerName: z.string().min(1).optional(),
  providerKind: z.string().min(1).optional(),
  providerCategory: z.enum(PROVIDER_CATEGORIES),
  supportedConnectionTypes: z.array(z.string()).min(1),
  supportedCredentialTypes: z.array(z.string()).default([]),
  supportedScopes: z.array(z.string()).default([]),
  supportedPermissions: z.array(z.string()).default([]),
  supportedCountries: z.array(z.string()).default([]),
  supportedWorkspaces: z.array(z.string()).default([]),
  requiresAccountHolder: z.boolean().default(true),
  supportsOAuth: z.boolean().default(false),
  supportsApiKey: z.boolean().default(false),
  supportsRefreshToken: z.boolean().default(false),
  supportsWebhook: z.boolean().default(false),
  supportsSandbox: z.boolean().default(false),
  supportsProduction: z.boolean().default(true),
  status: z.enum(["active", "deprecated", "preview"]).default("active"),
  version: z.string().min(1),
  registrySource: z.literal("REG-CONNECTION-PROVIDER"),
  pluginSource: z.string().optional(),
  governancePolicy: z.string().min(1),
  readinessPolicy: z.string().min(1),
  registryRef: z.string().optional(),
  channelType: z.string().optional(),
  defaultOperationType: z.string().optional(),
  supportedOperationTypes: z.array(z.string()).default([]),
  sandboxOnly: z.boolean().default(false),
});

export const connectionScopeConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  scopeId: z.string().min(1),
  scopeName: z.string().min(1),
  providerId: z.string().min(1),
  scopeKey: z.string().min(1),
  description: z.string().optional(),
});

export const connectionPermissionConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  permissionId: z.string().min(1),
  permissionName: z.string().min(1),
  providerId: z.string().min(1),
  permissionKey: z.string().min(1),
  scopeRefs: z.array(z.string()).default([]),
});

export const connectionAccountHolderConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  accountHolderTypeId: z.string().min(1),
  accountHolderTypeName: z.string().min(1),
  relationshipKind: z.string().min(1),
  eligibilityRuleRef: z.string().min(1),
  workspaceScoped: z.boolean().default(true),
});

export const connectionRequirementConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  requirementId: z.string().min(1),
  requirementName: z.string().min(1),
  providerId: z.string().min(1),
  connectionTypeRef: z.string().min(1),
  credentialTypeRef: z.string().optional(),
  requiredScopes: z.array(z.string()).default([]),
  requiredPermissions: z.array(z.string()).default([]),
  accountHolderTypeRef: z.string().optional(),
  authorizationType: z.enum([
    "oauth2",
    "oauth1",
    "api_key",
    "secret_key",
    "refresh_token",
    "lwa",
    "iam_role",
    "webhook_secret",
    "manual_upload",
    "future_authorization_type",
  ]).optional(),
});

export const connectionCapabilityConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  capabilityId: z.string().min(1),
  capabilityName: z.string().min(1),
  providerId: z.string().min(1),
  capabilityKey: z.string().min(1),
  supportedEnvironments: z.array(z.enum(["sandbox", "production"])).default(["production"]),
});

export const connectionDependencyConfigurationSchema = z.object({
  schemaVersion: z.literal(CONNECTION_REGISTRY_VERSION),
  dependencyId: z.string().min(1),
  dependencyName: z.string().min(1),
  providerId: z.string().min(1),
  dependsOnProviderId: z.string().optional(),
  dependsOnRegistryRef: z.string().optional(),
  dependencyKind: z.enum(["registry", "provider", "policy"]).default("registry"),
});

export const connectionRegistryTypeConfigurationSchema = z.object({
  schemaVersion: registrySchemaVersion,
  connectionTypeId: z.string().min(1),
  connectionTypeName: z.string().min(1),
  providerId: z.string().min(1),
  configurable: z.literal(true),
  defaultState: z.string().optional(),
  authorizationMethod: z.string().min(1),
  credentialTypeRef: z.string().optional(),
  requiredScopes: z.array(z.string()).default([]),
  permissionSetRefs: z.array(z.string()).default([]),
  defaultStatus: z.enum(CONNECTION_STATUSES).default("not_configured"),
  defaultReadinessStatus: z.enum(READINESS_STATES).default("not_ready"),
});

export type ConnectionDefinition = {
  connectionId: string;
  providerId: string;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  connectionType: string;
  credentialType: string;
  authorizationMethod: string;
  requiredScopes: string[];
  grantedScopes: string[];
  permissionSet: string[];
  status: ConnectionStatus;
  healthStatus: string;
  readinessStatus: ReadinessState;
  expiry: string | null;
  lastVerifiedAt: string | null;
  lastRefreshedAt: string | null;
  createdAt: string;
  updatedAt: string;
  governanceState: string;
};

export type WorkspaceConnectionProfile = {
  workspaceId: string;
  accountHolderId: string;
  providerCount: number;
  connectionTypeCount: number;
  requirementCount: number;
  capabilityCount: number;
  dependencyCount: number;
  supportedProviders: string[];
  generatedAt: string;
};

export const connectionRegistryPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "connection_provider",
    "connection_type",
    "credential_type",
    "scope_map",
    "permission_map",
    "dependency_rule",
    "readiness_rule",
  ]),
  pillowGovernance: z.literal(true),
});

export type ConnectionRegistryPluginManifest = z.infer<typeof connectionRegistryPluginManifestSchema>;

export function redactConnectionRegistrySecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential") ||
      lower.includes("oauth")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactConnectionRegistrySecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactConnectionRegistrySecrets(entry),
      ]),
    );
  }
  return value;
}
