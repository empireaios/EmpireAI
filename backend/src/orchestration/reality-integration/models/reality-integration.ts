import { z } from "zod";

import { CONNECTION_LIFECYCLE_STATES } from "./connection-lifecycle.js";

export const REALITY_PROVIDER_CATEGORIES = [
  "commerce",
  "suppliers",
  "payments",
  "advertising",
  "creative_ai",
  "analytics",
  "search_intelligence",
  "seo_intelligence",
  "product_intelligence",
  "buyer_intelligence",
  "trend_intelligence",
] as const;

export type RealityProviderCategory = (typeof REALITY_PROVIDER_CATEGORIES)[number];

/** REAL-002 — Universal connection lifecycle (replaces legacy states). */
export const CONNECTOR_LIFECYCLE_STATES = CONNECTION_LIFECYCLE_STATES;

export type ConnectorLifecycleState = (typeof CONNECTOR_LIFECYCLE_STATES)[number];

export const CONNECTOR_HEALTH_STATES = [
  "HEALTHY",
  "WARNING",
  "FAILED",
  "DISABLED",
] as const;

export type ConnectorHealthState = (typeof CONNECTOR_HEALTH_STATES)[number];

export const CREDENTIAL_TYPES = [
  "oauth",
  "api_key",
  "refresh_token",
  "secret",
] as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[number];

export const AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "oauth2_refresh",
  "webhook_secret",
] as const;

export const realityProviderDefinitionSchema = z.object({
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(REALITY_PROVIDER_CATEGORIES),
  capabilities: z.array(z.string()).min(1),
  regions: z.array(z.string()),
  rateLimitPerMinute: z.number().int().min(0),
  authentication: z.enum(AUTHENTICATION_METHODS),
  monthlyCostCents: z.number().int().min(0),
  documentationUrl: z.string().min(1),
  requiredHumanActions: z.array(z.string()),
  version: z.string().min(1),
  dependencies: z.array(z.string()),
  irreversibleActionsBlocked: z.literal(true),
  connectionOnly: z.boolean().default(true),
});

export const connectorRuntimeHealthSchema = z.object({
  state: z.enum(CONNECTOR_HEALTH_STATES),
  latencyMs: z.number().min(0),
  message: z.string(),
  lastHeartbeat: z.string().datetime({ offset: true }),
  rateLimitRemaining: z.number().int().min(0).optional(),
});

export const connectorRuntimeCostSchema = z.object({
  monthlyCostCents: z.number().int().min(0),
  usageCostEstimateCents: z.number().int().min(0),
  currency: z.string().default("USD"),
});

export const connectorRuntimeStateSchema = z.object({
  providerId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().optional(),
  lifecycle: z.enum(CONNECTOR_LIFECYCLE_STATES),
  health: connectorRuntimeHealthSchema,
  cost: connectorRuntimeCostSchema,
  dependencies: z.array(z.string()),
  capabilities: z.array(z.string()),
  credentialsRef: z.string().nullable(),
  version: z.string(),
  lastSync: z.string().datetime({ offset: true }).nullable(),
  governanceApproved: z.boolean(),
  executionBlocked: z.literal(true),
  updatedAt: z.string().datetime({ offset: true }),
});

export const credentialVaultRecordSchema = z.object({
  credentialsRef: z.string().min(1),
  workspaceId: z.string().min(1),
  providerId: z.string().min(1),
  credentialType: z.enum(CREDENTIAL_TYPES),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  rotatedAt: z.string().datetime({ offset: true }),
  revoked: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export const connectorRegistryEntrySchema = z.object({
  providerId: z.string().min(1),
  definition: realityProviderDefinitionSchema,
  health: connectorRuntimeHealthSchema.optional(),
  connectedWorkspaces: z.number().int().min(0),
});

export const connectorHealthCenterEntrySchema = z.object({
  providerId: z.string().min(1),
  displayName: z.string().min(1),
  category: z.enum(REALITY_PROVIDER_CATEGORIES),
  health: z.enum(CONNECTOR_HEALTH_STATES),
  lifecycle: z.enum(CONNECTOR_LIFECYCLE_STATES),
  monthlyCostCents: z.number().int().min(0),
  rateLimitPerMinute: z.number().int().min(0),
  latencyMs: z.number().min(0),
  lastSync: z.string().datetime({ offset: true }).nullable(),
  warnings: z.array(z.string()),
});

export const connectorHealthCenterSchema = z.object({
  workspaceId: z.string().min(1),
  entries: z.array(connectorHealthCenterEntrySchema),
  healthy: z.number().int().min(0),
  warning: z.number().int().min(0),
  failed: z.number().int().min(0),
  disabled: z.number().int().min(0),
  totalMonthlyCostCents: z.number().int().min(0),
  computedAt: z.string().datetime({ offset: true }),
});

export const realityIntegrationDashboardSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  connectedServices: z.array(z.string()),
  disconnectedServices: z.array(z.string()),
  monthlyCostCents: z.number().int().min(0),
  healthSummary: z.object({
    healthy: z.number().int().min(0),
    warning: z.number().int().min(0),
    failed: z.number().int().min(0),
    disabled: z.number().int().min(0),
  }),
  warnings: z.array(z.string()),
  capabilities: z.array(z.object({
    providerId: z.string(),
    capabilities: z.array(z.string()),
  })),
  recommendedConnections: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export const connectorMonitoringEventSchema = z.object({
  eventId: z.string().min(1),
  providerId: z.string().min(1),
  workspaceId: z.string().min(1),
  eventType: z.enum(["heartbeat", "error", "retry", "degraded", "dependency"]),
  message: z.string(),
  metadata: z.record(z.unknown()),
  recordedAt: z.string().datetime({ offset: true }),
});

export const realityIntegrationValidationSchema = z.object({
  validationId: z.string().min(1),
  workspaceId: z.string().min(1),
  valid: z.boolean(),
  runtimeValid: z.boolean(),
  registryValid: z.boolean(),
  vaultValid: z.boolean(),
  governanceValid: z.boolean(),
  dashboardValid: z.boolean(),
  providersValidated: z.number().int().min(0),
  blockers: z.array(z.string()),
  validatedAt: z.string().datetime({ offset: true }),
});

export type RealityProviderDefinition = z.infer<typeof realityProviderDefinitionSchema>;
export type ConnectorRuntimeHealth = z.infer<typeof connectorRuntimeHealthSchema>;
export type ConnectorRuntimeCost = z.infer<typeof connectorRuntimeCostSchema>;
export type ConnectorRuntimeState = z.infer<typeof connectorRuntimeStateSchema>;
export type CredentialVaultRecord = z.infer<typeof credentialVaultRecordSchema>;
export type ConnectorRegistryEntry = z.infer<typeof connectorRegistryEntrySchema>;
export type ConnectorHealthCenterEntry = z.infer<typeof connectorHealthCenterEntrySchema>;
export type ConnectorHealthCenter = z.infer<typeof connectorHealthCenterSchema>;
export type ConnectorMonitoringEvent = z.infer<typeof connectorMonitoringEventSchema>;
export type RealityIntegrationDashboard = z.infer<typeof realityIntegrationDashboardSchema>;
export type RealityIntegrationValidation = z.infer<typeof realityIntegrationValidationSchema>;
