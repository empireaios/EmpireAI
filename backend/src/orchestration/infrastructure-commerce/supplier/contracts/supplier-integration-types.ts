/**
 * G2-03 — Universal supplier integration contract types.
 * Framework-only — no live API implementations or supplier-specific logic.
 */

import { z } from "zod";

export const SUPPLIER_INTEGRATION_VERSION = "g2-03-v1" as const;

export const SUPPLIER_INTEGRATION_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "authenticate",
  "connect",
  "synchronise_catalogue",
  "synchronise_inventory",
  "submit_order",
  "track_fulfilment",
  "monitor_health",
  "disconnect",
  "retire",
] as const;

export type SupplierIntegrationLifecyclePhase = (typeof SUPPLIER_INTEGRATION_LIFECYCLE)[number];

export const SUPPLIER_ADAPTER_STATUSES = [
  "draft",
  "validated",
  "registered",
  "connected",
  "degraded",
  "disconnected",
  "retired",
] as const;

export type SupplierAdapterStatus = (typeof SUPPLIER_ADAPTER_STATUSES)[number];

export const SUPPLIER_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type SupplierHealthStatus = (typeof SUPPLIER_HEALTH_STATUSES)[number];

export const SUPPLIER_API_PROTOCOLS = [
  "rest",
  "graphql",
  "soap",
  "sdk",
  "webhook",
  "event_driven",
  "future_protocol",
] as const;

export type SupplierApiProtocol = (typeof SUPPLIER_API_PROTOCOLS)[number];

export const SUPPLIER_AUTHENTICATION_METHODS = [
  "oauth2",
  "api_key",
  "signed_request",
  "certificate",
  "supplier_native",
  "plugin_managed",
] as const;

export type SupplierAuthenticationMethod = (typeof SUPPLIER_AUTHENTICATION_METHODS)[number];

export const SUPPLIER_DOMAIN_CAPABILITIES = [
  "authentication",
  "catalogue",
  "inventory",
  "pricing",
  "orders",
  "fulfillment",
  "tracking",
] as const;

export type SupplierDomainCapability = (typeof SUPPLIER_DOMAIN_CAPABILITIES)[number];

export const SUPPLIER_FEATURE_FLAGS = [
  "catalogue_sync",
  "inventory_sync",
  "pricing_sync",
  "order_submit",
  "fulfillment_handoff",
  "tracking_poll",
  "webhook_ingress",
  "health_probe",
] as const;

export type SupplierFeatureFlag = (typeof SUPPLIER_FEATURE_FLAGS)[number];

export const SUPPLIER_FULFILMENT_MODES = [
  "dropship",
  "wholesale",
  "manufacturer",
  "print_on_demand",
  "warehouse",
  "3pl",
  "private",
  "future_category",
] as const;

export type SupplierFulfilmentMode = (typeof SUPPLIER_FULFILMENT_MODES)[number];

export const SUPPLIER_INVENTORY_FEATURES = [
  "real_time_stock",
  "reserved_stock",
  "warehouse_split",
  "lead_time_signal",
  "restock_alert",
] as const;

export type SupplierInventoryFeature = (typeof SUPPLIER_INVENTORY_FEATURES)[number];

export const SUPPLIER_TRACKING_FEATURES = [
  "shipment_status",
  "carrier_events",
  "delivery_confirmation",
  "exception_alerts",
  "tracking_webhook",
] as const;

export type SupplierTrackingFeature = (typeof SUPPLIER_TRACKING_FEATURES)[number];

export const SUPPLIER_EKLS_OBSERVATION_KINDS = [
  "supplier_reliability",
  "fulfilment_performance",
  "stock_confidence",
  "pricing_stability",
  "quality_signals",
  "tracking_performance",
] as const;

export type SupplierEklsObservationKind = (typeof SUPPLIER_EKLS_OBSERVATION_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const supplierRateLimitSchema = z.object({
  requestsPerMinute: z.number().int().positive().optional(),
  burst: z.number().int().positive().optional(),
  dailyQuota: z.number().int().positive().optional(),
  policyRef: z.string().optional(),
});

export type SupplierRateLimits = z.infer<typeof supplierRateLimitSchema>;

export const supplierApiSpecificationSchema = z.object({
  protocol: z.enum(SUPPLIER_API_PROTOCOLS),
  specificationVersion: z.string().min(1),
  transportProfile: z.string().optional(),
  futureProtocolHint: z.string().optional(),
});

export type SupplierApiSpecification = z.infer<typeof supplierApiSpecificationSchema>;

export const supplierDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type SupplierDomainContractRef = z.infer<typeof supplierDomainContractSchema>;

export const supplierPluginCompatibilitySchema = z.object({
  allowPluginRegistration: z.boolean(),
  pluginKind: z.literal("commerce_supplier").optional(),
  pluginId: z.string().optional(),
  minPluginVersion: z.string().optional(),
});

export type SupplierPluginCompatibility = z.infer<typeof supplierPluginCompatibilitySchema>;

export const supplierIntegrationConfigurationSchema = z.object({
  schemaVersion: z.literal(SUPPLIER_INTEGRATION_VERSION),
  authenticationMethod: z.enum(SUPPLIER_AUTHENTICATION_METHODS),
  apiSpecification: supplierApiSpecificationSchema,
  rateLimits: supplierRateLimitSchema,
  fulfilmentModes: z.array(z.enum(SUPPLIER_FULFILMENT_MODES)).min(1),
  inventoryFeatures: z.array(z.enum(SUPPLIER_INVENTORY_FEATURES)).min(1),
  trackingFeatures: z.array(z.enum(SUPPLIER_TRACKING_FEATURES)).min(1),
  supportedFeatures: z.array(z.enum(SUPPLIER_FEATURE_FLAGS)).min(1),
  domainContracts: z.object({
    authentication: supplierDomainContractSchema,
    catalogue: supplierDomainContractSchema,
    inventory: supplierDomainContractSchema,
    pricing: supplierDomainContractSchema,
    orders: supplierDomainContractSchema,
    fulfillment: supplierDomainContractSchema,
    tracking: supplierDomainContractSchema,
  }),
});

export type SupplierIntegrationConfiguration = z.infer<typeof supplierIntegrationConfigurationSchema>;

export const supplierAdapterContractSchema = z.object({
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  version: z.string().regex(semverPattern, "version must be semver (e.g. 1.0.0)"),
  status: z.enum(SUPPLIER_ADAPTER_STATUSES),
  capabilities: z.array(z.string()).min(1),
  supportedCountries: z.array(z.string()).min(1),
  supportedRegions: z.array(z.string()).min(1),
  authenticationMethod: z.enum(SUPPLIER_AUTHENTICATION_METHODS),
  apiSpecification: supplierApiSpecificationSchema,
  rateLimits: supplierRateLimitSchema,
  fulfilmentModes: z.array(z.enum(SUPPLIER_FULFILMENT_MODES)).min(1),
  inventoryFeatures: z.array(z.enum(SUPPLIER_INVENTORY_FEATURES)).min(1),
  trackingFeatures: z.array(z.enum(SUPPLIER_TRACKING_FEATURES)).min(1),
  supportedFeatures: z.array(z.enum(SUPPLIER_FEATURE_FLAGS)).min(1),
  healthStatus: z.enum(SUPPLIER_HEALTH_STATUSES),
  pluginCompatibility: supplierPluginCompatibilitySchema,
  domainContracts: supplierIntegrationConfigurationSchema.shape.domainContracts,
  registryRowRef: z.string().min(1),
  productSourceRefs: z.array(z.string()),
  policyRef: z.string().optional(),
  providerRef: z.string().optional(),
  discoverySource: z.literal("RegistryLoader:REG-SUPPLIER"),
});

export type SupplierAdapterContract = z.infer<typeof supplierAdapterContractSchema>;

export type SupplierPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  supplierRegistryRowId: string;
  supportedProtocols: SupplierApiProtocol[];
  supportedFeatures: SupplierFeatureFlag[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type SupplierPluginRecord = SupplierPluginManifest & {
  lifecyclePhase: SupplierIntegrationLifecyclePhase;
  healthStatus: SupplierHealthStatus;
  registeredAt: string;
};

export type SupplierDiscoveryResult = {
  discoveredCount: number;
  suppliers: SupplierAdapterContract[];
  generatedAt: string;
  discoverySource: "RegistryLoader:REG-SUPPLIER";
};

export type SupplierCapabilityResolution = {
  supplierId: string;
  resolvedCapabilities: SupplierDomainCapability[];
  supportedFeatures: SupplierFeatureFlag[];
  lifecyclePhase: SupplierIntegrationLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type SupplierLifecycleTransitionRequest = {
  supplierId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  targetPhase: SupplierIntegrationLifecyclePhase;
};

export type SupplierLifecycleTransitionResult = {
  supplierId: string;
  previousPhase: SupplierIntegrationLifecyclePhase;
  currentPhase: SupplierIntegrationLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type SupplierHealthSnapshot = {
  supplierId: string;
  healthStatus: SupplierHealthStatus;
  lifecyclePhase: SupplierIntegrationLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type SupplierBrainCapabilityDescriptor = {
  supplierId: string;
  capabilities: string[];
  domainCapabilities: SupplierDomainCapability[];
  supportedFeatures: SupplierFeatureFlag[];
  discoverySource: "RegistryLoader:REG-SUPPLIER";
};

export type SupplierEngineCapabilityEnvelope = {
  engineModule: string;
  supplierId: string;
  capabilityIds: string[];
  domainCapabilities: SupplierDomainCapability[];
  discoverySource: "RegistryLoader:supplier-engine-bridge";
};

export type SupplierEklsObservationRecord = {
  observationId: string;
  supplierId: string;
  workspaceId: string;
  actorId: string;
  kind: SupplierEklsObservationKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "latency_ms" | "count";
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type SupplierEklsObservationResult = {
  accepted: boolean;
  observationId?: string;
  reason: string;
  eklsGoverned: boolean;
};
