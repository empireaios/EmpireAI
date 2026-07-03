/**
 * G2-09 — Commerce plugin integration contract types.
 * Canonical extension layer — consumes EmpireAI Plugin Framework; never owns it.
 */

import { z } from "zod";

export const COMMERCE_PLUGIN_INTEGRATION_VERSION = "g2-09-v1" as const;

export const COMMERCE_PLUGIN_LIFECYCLE = [
  "discover",
  "validate",
  "register",
  "load",
  "enable",
  "execute",
  "monitor",
  "disable",
  "unload",
  "deprecate",
  "retire",
] as const;

export type CommercePluginLifecyclePhase = (typeof COMMERCE_PLUGIN_LIFECYCLE)[number];

export const COMMERCE_PLUGIN_STATUSES = [
  "draft",
  "validated",
  "registered",
  "loaded",
  "enabled",
  "executing",
  "monitored",
  "disabled",
  "unloaded",
  "deprecated",
  "retired",
] as const;

export type CommercePluginStatus = (typeof COMMERCE_PLUGIN_STATUSES)[number];

export const COMMERCE_PLUGIN_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type CommercePluginHealthStatus = (typeof COMMERCE_PLUGIN_HEALTH_STATUSES)[number];

export const COMMERCE_PLUGIN_CATEGORIES = [
  "marketplace_plugins",
  "supplier_plugins",
  "storefront_plugins",
  "payment_plugins",
  "logistics_plugins",
  "analytics_plugins",
  "commerce_workflow_plugins",
  "commerce_validation_plugins",
  "commerce_monitoring_plugins",
  "future_commerce_plugins",
] as const;

export type CommercePluginCategory = (typeof COMMERCE_PLUGIN_CATEGORIES)[number];

export const COMMERCE_PLUGIN_KINDS = [
  "commerce_marketplace",
  "commerce_supplier",
  "commerce_storefront",
  "commerce_payment",
  "commerce_logistics",
  "commerce_analytics",
  "commerce_workflow",
  "commerce_validation",
  "commerce_monitoring",
  "commerce_future",
] as const;

export type CommercePluginKind = (typeof COMMERCE_PLUGIN_KINDS)[number];

export const COMMERCE_PLUGIN_PROVENANCE = [
  "official",
  "internal",
  "third_party",
  "enterprise",
] as const;

export type CommercePluginProvenance = (typeof COMMERCE_PLUGIN_PROVENANCE)[number];

export const COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS = [
  "plugin_registration",
  "plugin_execution",
  "plugin_performance",
  "plugin_failure",
  "plugin_recovery",
  "plugin_retirement",
  "operational_observation",
] as const;

export type CommercePluginEklsObservationKind =
  (typeof COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const COMMERCE_PLUGIN_CATEGORY_TO_KIND: Record<CommercePluginCategory, CommercePluginKind> = {
  marketplace_plugins: "commerce_marketplace",
  supplier_plugins: "commerce_supplier",
  storefront_plugins: "commerce_storefront",
  payment_plugins: "commerce_payment",
  logistics_plugins: "commerce_logistics",
  analytics_plugins: "commerce_analytics",
  commerce_workflow_plugins: "commerce_workflow",
  commerce_validation_plugins: "commerce_validation",
  commerce_monitoring_plugins: "commerce_monitoring",
  future_commerce_plugins: "commerce_future",
};

export const commercePluginRegistryRefSchema = z.object({
  registryId: z.string().min(1),
  registryRowId: z.string().min(1),
});

export type CommercePluginRegistryRef = z.infer<typeof commercePluginRegistryRefSchema>;

export const commercePluginPermissionSchema = z.object({
  permissionId: z.string().min(1),
  scope: z.enum(["read", "write", "execute", "admin"]),
  policyRef: z.string().optional(),
});

export type CommercePluginPermission = z.infer<typeof commercePluginPermissionSchema>;

export const commercePluginCompatibilitySchema = z.object({
  minFrameworkVersion: z.string().min(1),
  supportedCategories: z.array(z.enum(COMMERCE_PLUGIN_CATEGORIES)).min(1),
  isolationRequired: z.literal(true),
});

export type CommercePluginCompatibilityMatrix = z.infer<
  typeof commercePluginCompatibilitySchema
>;

export const commercePluginSlotConfigurationSchema = z.object({
  schemaVersion: z.literal(COMMERCE_PLUGIN_INTEGRATION_VERSION),
  category: z.enum(COMMERCE_PLUGIN_CATEGORIES),
  pluginKind: z.enum(COMMERCE_PLUGIN_KINDS),
  supportedCapabilities: z.array(z.string()).min(1),
  supportedInterfaces: z.array(z.string()).min(1),
  registryRef: commercePluginRegistryRefSchema,
  permissions: z.array(commercePluginPermissionSchema).min(1),
  compatibility: commercePluginCompatibilitySchema,
  lifecycleHooks: z.array(z.enum(COMMERCE_PLUGIN_LIFECYCLE)).min(1),
  configuration: z.record(z.unknown()),
});

export type CommercePluginSlotConfiguration = z.infer<
  typeof commercePluginSlotConfigurationSchema
>;

export type CommercePluginSlotRow = {
  id: string;
  name: string;
  description: string;
  status: "VALIDATED" | "PUBLISHED";
  version: string;
  owner: string;
  dependencies: string[];
  policyRef?: string;
  configuration: Record<string, unknown>;
};

export const commercePluginAdapterContractSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginVersion: z.string().regex(semverPattern),
  pluginOwner: z.string().min(1),
  status: z.enum(COMMERCE_PLUGIN_STATUSES),
  category: z.enum(COMMERCE_PLUGIN_CATEGORIES),
  pluginKind: z.enum(COMMERCE_PLUGIN_KINDS),
  supportedCapabilities: z.array(z.string()).min(1),
  supportedInterfaces: z.array(z.string()).min(1),
  dependencies: z.array(z.string()),
  registryReferences: z.array(commercePluginRegistryRefSchema).min(1),
  configuration: z.record(z.unknown()),
  permissions: z.array(commercePluginPermissionSchema).min(1),
  healthStatus: z.enum(COMMERCE_PLUGIN_HEALTH_STATUSES),
  lifecycleHooks: z.array(z.enum(COMMERCE_PLUGIN_LIFECYCLE)).min(1),
  compatibility: commercePluginCompatibilitySchema,
  provenance: z.enum(COMMERCE_PLUGIN_PROVENANCE),
  slotRef: z.string().min(1),
  discoverySource: z.literal("EmpireAIPluginFramework:commerce-plugin-integration"),
});

export type CommercePluginAdapterContract = z.infer<typeof commercePluginAdapterContractSchema>;

export type CommercePluginRegistrationManifest = {
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  pluginOwner: string;
  category: CommercePluginCategory;
  slotId: string;
  supportedCapabilities: string[];
  provenance: CommercePluginProvenance;
  pillowGovernance: true;
  brainRouted: true;
  extensions: Record<string, unknown>;
};

export type CommercePluginRecord = CommercePluginAdapterContract & {
  lifecyclePhase: CommercePluginLifecyclePhase;
  registeredAt: string;
  frameworkRegistered: true;
};

export type CommercePluginDiscoveryResult = {
  discoveredCount: number;
  plugins: CommercePluginAdapterContract[];
  slots: CommercePluginSlotRow[];
  generatedAt: string;
  discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration";
};

export type CommercePluginCapabilityResolution = {
  pluginId: string;
  resolvedCapabilities: string[];
  category: CommercePluginCategory;
  lifecyclePhase: CommercePluginLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type CommercePluginLifecycleTransitionRequest = {
  pluginId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  brainRouted: true;
  targetPhase: CommercePluginLifecyclePhase;
};

export type CommercePluginLifecycleTransitionResult = {
  pluginId: string;
  previousPhase: CommercePluginLifecyclePhase;
  currentPhase: CommercePluginLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type CommercePluginCompatibilityResult = {
  pluginId: string;
  compatible: boolean;
  isolationVerified: boolean;
  reason: string;
};

export type CommercePluginBrainCapabilityDescriptor = {
  pluginId: string;
  category: CommercePluginCategory;
  capabilities: string[];
  validated: true;
  discoverySource: "EmpireAIPluginFramework:commerce-plugin-integration";
  brainRouted: true;
};

export type CommercePluginEngineExtensionEnvelope = {
  engineId: string;
  pluginId: string;
  category: CommercePluginCategory;
  capabilityIds: string[];
  coreModified: false;
  discoverySource: "EmpireAIPluginFramework:commerce-plugin-engine-bridge";
};

export type CommercePluginEklsObservationRecord = {
  observationId: string;
  pluginId: string;
  workspaceId: string;
  actorId: string;
  kind: CommercePluginEklsObservationKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type CommercePluginEklsObservationResult = {
  accepted: boolean;
  observationId?: string;
  reason: string;
  eklsGoverned: boolean;
};
