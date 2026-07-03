/**
 * G2-06 — Universal logistics integration contract types.
 * Framework-only — no live carrier APIs, label generation, or provider-specific logic.
 */

import { z } from "zod";

export const LOGISTICS_INTEGRATION_VERSION = "g2-06-v1" as const;

export const LOGISTICS_SHIPMENT_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "authenticate",
  "create_shipment",
  "generate_tracking",
  "track_shipment",
  "update_delivery_status",
  "process_return",
  "archive_shipment",
] as const;

export type LogisticsShipmentLifecyclePhase = (typeof LOGISTICS_SHIPMENT_LIFECYCLE)[number];

export const LOGISTICS_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "authenticated",
  "ready",
  "degraded",
  "suspended",
  "archived",
] as const;

export type LogisticsAdapterStatus = (typeof LOGISTICS_ADAPTER_STATUSES)[number];

export const LOGISTICS_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type LogisticsHealthStatus = (typeof LOGISTICS_HEALTH_STATUSES)[number];

export const LOGISTICS_AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "signed_request",
  "certificate",
  "provider_native",
  "plugin_managed",
] as const;

export type LogisticsAuthenticationMethod = (typeof LOGISTICS_AUTHENTICATION_METHODS)[number];

export const LOGISTICS_PROVIDER_KINDS = [
  "postal",
  "courier",
  "freight",
  "warehouse",
  "3pl",
  "cross_border",
  "future_fulfilment",
] as const;

export type LogisticsProviderKind = (typeof LOGISTICS_PROVIDER_KINDS)[number];

export const LOGISTICS_DOMAIN_CAPABILITIES = [
  "authentication",
  "shipment_creation",
  "rate_quotation",
  "tracking",
  "delivery_status",
  "return_shipment",
  "warehouse",
] as const;

export type LogisticsDomainCapability = (typeof LOGISTICS_DOMAIN_CAPABILITIES)[number];

export const LOGISTICS_EKLS_OBSERVATION_KINDS = [
  "carrier_performance",
  "shipping_performance",
  "delivery_outcome",
  "return_outcome",
  "operational_observation",
  "logistics_health",
] as const;

export type LogisticsEklsObservationKind = (typeof LOGISTICS_EKLS_OBSERVATION_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const logisticsServiceSchema = z.object({
  serviceId: z.string().min(1),
  serviceKind: z.enum(LOGISTICS_PROVIDER_KINDS),
  supported: z.boolean(),
});

export type LogisticsServiceRef = z.infer<typeof logisticsServiceSchema>;

export const logisticsDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type LogisticsDomainContractRef = z.infer<typeof logisticsDomainContractSchema>;

export const logisticsPluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_logistics").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type LogisticsPluginCompatibility = z.infer<typeof logisticsPluginCompatibilitySchema>;

export const logisticsIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(LOGISTICS_INTEGRATION_VERSION),
  authenticationMethod: z.enum(LOGISTICS_AUTHENTICATION_METHODS),
  providerKind: z.enum(LOGISTICS_PROVIDER_KINDS),
  shippingServices: z.array(logisticsServiceSchema).min(1),
  trackingServices: z.array(logisticsServiceSchema).min(1),
  returnServices: z.array(logisticsServiceSchema),
  warehouseServices: z.array(logisticsServiceSchema),
  domainContracts: z.object({
    authentication: logisticsDomainContractSchema,
    shipment_creation: logisticsDomainContractSchema,
    rate_quotation: logisticsDomainContractSchema,
    tracking: logisticsDomainContractSchema,
    delivery_status: logisticsDomainContractSchema,
    return_shipment: logisticsDomainContractSchema,
    warehouse: logisticsDomainContractSchema,
  }),
});

export type LogisticsIntegrationConfiguration = z.infer<
  typeof logisticsIntegrationConfigurationSchema
>;

export const logisticsAdapterContractSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  status: z.enum(LOGISTICS_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedCountries: z.array(z.string()).min(1),
  supportedRegions: z.array(z.string()).min(1),
  authenticationMethod: z.enum(LOGISTICS_AUTHENTICATION_METHODS),
  providerKind: z.enum(LOGISTICS_PROVIDER_KINDS),
  shippingServices: z.array(logisticsServiceSchema).min(1),
  trackingServices: z.array(logisticsServiceSchema).min(1),
  returnServices: z.array(logisticsServiceSchema),
  warehouseServices: z.array(logisticsServiceSchema),
  healthStatus: z.enum(LOGISTICS_HEALTH_STATUSES),
  pluginCompatibility: logisticsPluginCompatibilitySchema,
  domainContracts: logisticsIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  policyRef: z.string().optional(),
  providerRef: z.string().optional(),
  discoverySource: z.literal("RegistryLoader:REG-LOGISTICS"),
});

export type LogisticsAdapterContract = z.infer<typeof logisticsAdapterContractSchema>;

export type LogisticsPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  logisticsRegistryRowId: string;
  providerKind: LogisticsProviderKind;
  shippingServices: LogisticsServiceRef[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type LogisticsPluginRecord = LogisticsPluginManifest & {
  lifecyclePhase: LogisticsShipmentLifecyclePhase;
  healthStatus: LogisticsHealthStatus;
  registeredAt: string;
};

export type LogisticsDiscoveryResult = {
  discoveredCount: number;
  providers: LogisticsAdapterContract[];
  generatedAt: string;
  discoverySource: "RegistryLoader:REG-LOGISTICS";
};

export type LogisticsCapabilityResolution = {
  providerId: string;
  resolvedCapabilities: LogisticsDomainCapability[];
  shippingServices: LogisticsServiceRef[];
  lifecyclePhase: LogisticsShipmentLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type LogisticsLifecycleTransitionRequest = {
  providerId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: LogisticsShipmentLifecyclePhase;
};

export type LogisticsLifecycleTransitionResult = {
  providerId: string;
  previousPhase: LogisticsShipmentLifecyclePhase;
  currentPhase: LogisticsShipmentLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type LogisticsHealthSnapshot = {
  providerId: string;
  healthStatus: LogisticsHealthStatus;
  lifecyclePhase: LogisticsShipmentLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type LogisticsBrainCapabilityDescriptor = {
  providerId: string;
  capabilities: string[];
  domainCapabilities: LogisticsDomainCapability[];
  shippingServices: LogisticsServiceRef[];
  discoverySource: "RegistryLoader:REG-LOGISTICS";
};

export type LogisticsEngineCapabilityEnvelope = {
  consumerId: string;
  providerId: string;
  capabilityIds: string[];
  domainCapabilities: LogisticsDomainCapability[];
  discoverySource: "RegistryLoader:logistics-engine-bridge";
};

export type LogisticsEklsObservationRecord = {
  observationId: string;
  providerId: string;
  workspaceId: string;
  actorId: string;
  kind: LogisticsEklsObservationKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type LogisticsEklsObservationResult = {
  accepted: boolean;
  observationId?: string;
  reason: string;
  eklsGoverned: boolean;
};
