/**
 * G2-02 — Universal marketplace integration contract types.
 * Framework-only — no live API implementations or marketplace-specific logic.
 */

import { z } from "zod";

export const MARKETPLACE_INTEGRATION_VERSION = "g2-02-v1" as const;

export const MARKETPLACE_INTEGRATION_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "authenticate",
  "connect",
  "synchronise",
  "monitor",
  "disconnect",
  "retire",
] as const;

export type MarketplaceIntegrationLifecyclePhase =
  (typeof MARKETPLACE_INTEGRATION_LIFECYCLE)[number];

export const MARKETPLACE_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "connected",
  "degraded",
  "disconnected",
  "retired",
] as const;

export type MarketplaceAdapterStatus = (typeof MARKETPLACE_ADAPTER_STATUSES)[number];

export const MARKETPLACE_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type MarketplaceHealthStatus = (typeof MARKETPLACE_HEALTH_STATUSES)[number];

export const MARKETPLACE_API_PROTOCOLS = [
  "rest",
  "graphql",
  "soap",
  "sdk",
  "webhook",
  "event_driven",
  "future_protocol",
] as const;

export type MarketplaceApiProtocol = (typeof MARKETPLACE_API_PROTOCOLS)[number];

export const MARKETPLACE_AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "signed_request",
  "certificate",
  "marketplace_native",
  "plugin_managed",
] as const;

export type MarketplaceAuthenticationMethod = (typeof MARKETPLACE_AUTHENTICATION_METHODS)[number];

export const MARKETPLACE_DOMAIN_CAPABILITIES = [
  "authentication",
  "catalogue",
  "orders",
  "inventory",
  "pricing",
  "fulfillment",
  "status",
] as const;

export type MarketplaceDomainCapability = (typeof MARKETPLACE_DOMAIN_CAPABILITIES)[number];

export const MARKETPLACE_FEATURE_FLAGS = [
  "catalogue_sync",
  "order_ingest",
  "inventory_sync",
  "pricing_sync",
  "fulfillment_handoff",
  "status_polling",
  "webhook_ingress",
  "health_probe",
] as const;

export type MarketplaceFeatureFlag = (typeof MARKETPLACE_FEATURE_FLAGS)[number];

export const marketplaceRateLimitSchema = z.object({
  requestsPerMinute: z.number().int().positive().optional(),
  burst: z.number().int().positive().optional(),
  dailyQuota: z.number().int().positive().optional(),
  policyRef: z.string().optional(),
});

export type MarketplaceRateLimits = z.infer<typeof marketplaceRateLimitSchema>;

export const marketplaceApiSpecificationSchema = z.object({
  protocol: z.enum(MARKETPLACE_API_PROTOCOLS),
  specificationVersion: z.string().min(1),
  transportProfile: z.string().optional(),
  futureProtocolHint: z.string().optional(),
});

export type MarketplaceApiSpecification = z.infer<typeof marketplaceApiSpecificationSchema>;

export const marketplaceDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type MarketplaceDomainContract = z.infer<typeof marketplaceDomainContractSchema>;

export const marketplacePluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_marketplace").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type MarketplacePluginCompatibility = z.infer<typeof marketplacePluginCompatibilitySchema>;

export const marketplaceIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(MARKETPLACE_INTEGRATION_VERSION),
  authenticationMethod: z.enum(MARKETPLACE_AUTHENTICATION_METHODS),
  apiSpecification: marketplaceApiSpecificationSchema,
  rateLimits: marketplaceRateLimitSchema,
  supportedFeatures: z.array(z.enum(MARKETPLACE_FEATURE_FLAGS)).min(1),
  domainContracts: z.object({
    authentication: marketplaceDomainContractSchema,
    catalogue: marketplaceDomainContractSchema,
    orders: marketplaceDomainContractSchema,
    inventory: marketplaceDomainContractSchema,
    pricing: marketplaceDomainContractSchema,
    fulfillment: marketplaceDomainContractSchema,
    status: marketplaceDomainContractSchema,
  }),
});

export type MarketplaceIntegrationConfiguration = z.infer<
  typeof marketplaceIntegrationConfigurationSchema
>;

export const marketplaceAdapterContractSchema = z.object({
  marketplaceId: z.string().min(1),
  marketplaceName: z.string().min(1),
  version: z.string().min(1),
  status: z.enum(MARKETPLACE_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedCountries: z.array(z.string()).min(1),
  supportedRegions: z.array(z.string()).min(1),
  authenticationMethod: z.enum(MARKETPLACE_AUTHENTICATION_METHODS),
  apiSpecification: marketplaceApiSpecificationSchema,
  rateLimits: marketplaceRateLimitSchema,
  supportedFeatures: z.array(z.enum(MARKETPLACE_FEATURE_FLAGS)).min(1),
  healthStatus: z.enum(MARKETPLACE_HEALTH_STATUSES),
  pluginCompatibility: marketplacePluginCompatibilitySchema,
  domainContracts: marketplaceIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  policyRef: z.string().optional(),
  providerRef: z.string().optional(),
  discoverySource: z.literal("RegistryLoader:REG-MARKETPLACE"),
});

export type MarketplaceAdapterContract = z.infer<typeof marketplaceAdapterContractSchema>;

export type MarketplacePluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  marketplaceRegistryRowId: string;
  supportedProtocols: MarketplaceApiProtocol[];
  supportedFeatures: MarketplaceFeatureFlag[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type MarketplacePluginRecord = MarketplacePluginManifest & {
  lifecyclePhase: MarketplaceIntegrationLifecyclePhase;
  healthStatus: MarketplaceHealthStatus;
  registeredAt: string;
};

export type MarketplaceDiscoveryResult = {
  discoveredCount: number;
  marketplaces: MarketplaceAdapterContract[];
  generatedAt: string;
  discoverySource: "RegistryLoader:REG-MARKETPLACE";
};

export type MarketplaceCapabilityResolution = {
  marketplaceId: string;
  resolvedCapabilities: MarketplaceDomainCapability[];
  supportedFeatures: MarketplaceFeatureFlag[];
  lifecyclePhase: MarketplaceIntegrationLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type MarketplaceLifecycleTransitionRequest = {
  marketplaceId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: MarketplaceIntegrationLifecyclePhase;
};

export type MarketplaceLifecycleTransitionResult = {
  marketplaceId: string;
  previousPhase: MarketplaceIntegrationLifecyclePhase;
  currentPhase: MarketplaceIntegrationLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type MarketplaceHealthSnapshot = {
  marketplaceId: string;
  healthStatus: MarketplaceHealthStatus;
  lifecyclePhase: MarketplaceIntegrationLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type MarketplaceBrainCapabilityDescriptor = {
  marketplaceId: string;
  capabilities: string[];
  domainCapabilities: MarketplaceDomainCapability[];
  supportedFeatures: MarketplaceFeatureFlag[];
  discoverySource: "RegistryLoader:REG-MARKETPLACE";
};

export type MarketplaceEngineCapabilityEnvelope = {
  engineModule: string;
  marketplaceId: string;
  capabilityIds: string[];
  domainCapabilities: MarketplaceDomainCapability[];
  discoverySource: "RegistryLoader:marketplace-engine-bridge";
};
