/**
 * G2-04 — Universal storefront integration contract types.
 * Framework-only — no live deployment or storefront-specific logic.
 */

import { z } from "zod";

export const STOREFRONT_INTEGRATION_VERSION = "g2-04-v1" as const;

export const STOREFRONT_INTEGRATION_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "provision",
  "configure",
  "publish",
  "synchronise",
  "monitor",
  "suspend",
  "archive",
  "retire",
] as const;

export type StorefrontIntegrationLifecyclePhase = (typeof STOREFRONT_INTEGRATION_LIFECYCLE)[number];

export const STOREFRONT_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "provisioned",
  "configured",
  "published",
  "degraded",
  "suspended",
  "archived",
  "retired",
] as const;

export type StorefrontAdapterStatus = (typeof STOREFRONT_ADAPTER_STATUSES)[number];

export const STOREFRONT_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type StorefrontHealthStatus = (typeof STOREFRONT_HEALTH_STATUSES)[number];

export const STOREFRONT_CHANNEL_MODELS = [
  "hosted",
  "self_hosted",
  "marketplace_storefront",
  "headless",
  "native_mobile",
  "future_channel",
] as const;

export type StorefrontChannelModel = (typeof STOREFRONT_CHANNEL_MODELS)[number];

export const STOREFRONT_AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "signed_request",
  "certificate",
  "storefront_native",
  "plugin_managed",
] as const;

export type StorefrontAuthenticationMethod = (typeof STOREFRONT_AUTHENTICATION_METHODS)[number];

export const STOREFRONT_DOMAIN_CAPABILITIES = [
  "provisioning",
  "brand_assignment",
  "theme_assignment",
  "product_publishing",
  "collection_management",
  "navigation_management",
  "content_synchronisation",
] as const;

export type StorefrontDomainCapability = (typeof STOREFRONT_DOMAIN_CAPABILITIES)[number];

export const STOREFRONT_PUBLISHING_CAPABILITIES = [
  "product_publish",
  "product_unpublish",
  "collection_publish",
  "navigation_publish",
  "content_publish",
  "scheduled_publish",
] as const;

export type StorefrontPublishingCapability = (typeof STOREFRONT_PUBLISHING_CAPABILITIES)[number];

export const STOREFRONT_THEME_CAPABILITIES = [
  "theme_bind",
  "theme_preview",
  "theme_swap",
  "layout_configure",
] as const;

export type StorefrontThemeCapability = (typeof STOREFRONT_THEME_CAPABILITIES)[number];

export const STOREFRONT_COLLECTION_CAPABILITIES = [
  "collection_create",
  "collection_update",
  "collection_sync",
  "collection_archive",
] as const;

export type StorefrontCollectionCapability = (typeof STOREFRONT_COLLECTION_CAPABILITIES)[number];

export const STOREFRONT_CONTENT_CAPABILITIES = [
  "content_sync",
  "content_localize",
  "content_preview",
  "content_archive",
] as const;

export type StorefrontContentCapability = (typeof STOREFRONT_CONTENT_CAPABILITIES)[number];

export const STOREFRONT_EKLS_OUTCOME_KINDS = [
  "publishing_history",
  "brand_evolution",
  "store_health",
  "content_quality",
  "store_growth",
  "operational_observation",
] as const;

export type StorefrontEklsOutcomeKind = (typeof STOREFRONT_EKLS_OUTCOME_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const storefrontDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type StorefrontDomainContractRef = z.infer<typeof storefrontDomainContractSchema>;

export const storefrontPluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_storefront").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type StorefrontPluginCompatibility = z.infer<typeof storefrontPluginCompatibilitySchema>;

export const storefrontIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(STOREFRONT_INTEGRATION_VERSION),
  channelModel: z.enum(STOREFRONT_CHANNEL_MODELS),
  authenticationMethod: z.enum(STOREFRONT_AUTHENTICATION_METHODS),
  publishingCapabilities: z.array(z.enum(STOREFRONT_PUBLISHING_CAPABILITIES)).min(1),
  themeCapabilities: z.array(z.enum(STOREFRONT_THEME_CAPABILITIES)).min(1),
  collectionCapabilities: z.array(z.enum(STOREFRONT_COLLECTION_CAPABILITIES)).min(1),
  contentCapabilities: z.array(z.enum(STOREFRONT_CONTENT_CAPABILITIES)).min(1),
  domainContracts: z.object({
    provisioning: storefrontDomainContractSchema,
    brand_assignment: storefrontDomainContractSchema,
    theme_assignment: storefrontDomainContractSchema,
    product_publishing: storefrontDomainContractSchema,
    collection_management: storefrontDomainContractSchema,
    navigation_management: storefrontDomainContractSchema,
    content_synchronisation: storefrontDomainContractSchema,
  }),
  brandRef: z.string().optional(),
  categoryRef: z.string().optional(),
});

export type StorefrontIntegrationConfiguration = z.infer<typeof storefrontIntegrationConfigurationSchema>;

export const storefrontAdapterContractSchema = z.object({
  storefrontId: z.string().min(1),
  storefrontName: z.string().min(1),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  status: z.enum(STOREFRONT_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedCountries: z.array(z.string()).min(1),
  supportedRegions: z.array(z.string()).min(1),
  authenticationMethod: z.enum(STOREFRONT_AUTHENTICATION_METHODS),
  publishingCapabilities: z.array(z.enum(STOREFRONT_PUBLISHING_CAPABILITIES)).min(1),
  themeCapabilities: z.array(z.enum(STOREFRONT_THEME_CAPABILITIES)).min(1),
  collectionCapabilities: z.array(z.enum(STOREFRONT_COLLECTION_CAPABILITIES)).min(1),
  contentCapabilities: z.array(z.enum(STOREFRONT_CONTENT_CAPABILITIES)).min(1),
  healthStatus: z.enum(STOREFRONT_HEALTH_STATUSES),
  pluginCompatibility: storefrontPluginCompatibilitySchema,
  domainContracts: storefrontIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  brandRef: z.string().optional(),
  categoryRef: z.string().optional(),
  policyRef: z.string().optional(),
  deploymentRef: z.string().optional(),
  discoverySource: z.literal("RegistryLoader:REG-STOREFRONT"),
});

export type StorefrontAdapterContract = z.infer<typeof storefrontAdapterContractSchema>;

export type StorefrontPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  storefrontRegistryRowId: string;
  channelModel: StorefrontChannelModel;
  publishingCapabilities: StorefrontPublishingCapability[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type StorefrontPluginRecord = StorefrontPluginManifest & {
  lifecyclePhase: StorefrontIntegrationLifecyclePhase;
  healthStatus: StorefrontHealthStatus;
  registeredAt: string;
};

export type StorefrontDiscoveryResult = {
  discoveredCount: number;
  storefronts: StorefrontAdapterContract[];
  generatedAt: string;
  discoverySource: "RegistryLoader:REG-STOREFRONT";
};

export type StorefrontCapabilityResolution = {
  storefrontId: string;
  resolvedCapabilities: StorefrontDomainCapability[];
  publishingCapabilities: StorefrontPublishingCapability[];
  lifecyclePhase: StorefrontIntegrationLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type StorefrontProvisioningValidationResult = {
  storefrontId: string;
  valid: boolean;
  brandAssigned: boolean;
  categoryAssigned: boolean;
  provisioningReady: boolean;
  reason: string;
};

export type StorefrontLifecycleTransitionRequest = {
  storefrontId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: StorefrontIntegrationLifecyclePhase;
};

export type StorefrontLifecycleTransitionResult = {
  storefrontId: string;
  previousPhase: StorefrontIntegrationLifecyclePhase;
  currentPhase: StorefrontIntegrationLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type StorefrontHealthSnapshot = {
  storefrontId: string;
  healthStatus: StorefrontHealthStatus;
  lifecyclePhase: StorefrontIntegrationLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type StorefrontBrainCapabilityDescriptor = {
  storefrontId: string;
  capabilities: string[];
  domainCapabilities: StorefrontDomainCapability[];
  publishingCapabilities: StorefrontPublishingCapability[];
  discoverySource: "RegistryLoader:REG-STOREFRONT";
};

export type StorefrontEngineCapabilityEnvelope = {
  engineModule: string;
  storefrontId: string;
  capabilityIds: string[];
  domainCapabilities: StorefrontDomainCapability[];
  discoverySource: "RegistryLoader:storefront-engine-bridge";
};

export type StorefrontEklsOutcomeRecord = {
  outcomeId: string;
  storefrontId: string;
  workspaceId: string;
  actorId: string;
  kind: StorefrontEklsOutcomeKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type StorefrontEklsOutcomeResult = {
  accepted: boolean;
  outcomeId?: string;
  reason: string;
  eklsGoverned: boolean;
};
