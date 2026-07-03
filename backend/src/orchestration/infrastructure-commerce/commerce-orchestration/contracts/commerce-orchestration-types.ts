/**
 * G2-08 — Commerce orchestration contract types.
 * Framework-only — coordinates commerce; never replaces Brain or Business Automation.
 */

import { z } from "zod";

export const COMMERCE_ORCHESTRATION_VERSION = "g2-08-v1" as const;

export const COMMERCE_ORCHESTRATION_LIFECYCLE = [
  "discover",
  "validate",
  "prepare",
  "coordinate",
  "synchronise",
  "monitor",
  "complete",
  "recover",
  "archive",
] as const;

export type CommerceOrchestrationLifecyclePhase =
  (typeof COMMERCE_ORCHESTRATION_LIFECYCLE)[number];

export const COMMERCE_ORCHESTRATION_STATUSES = [
  "draft",
  "validated",
  "prepared",
  "coordinating",
  "synchronising",
  "monitoring",
  "completed",
  "recovering",
  "archived",
] as const;

export type CommerceOrchestrationStatus = (typeof COMMERCE_ORCHESTRATION_STATUSES)[number];

export const COMMERCE_HEALTH_STATUSES = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
] as const;

export type CommerceHealthStatus = (typeof COMMERCE_HEALTH_STATUSES)[number];

export const COMMERCE_PARTICIPATING_COMPONENTS = [
  "marketplace",
  "supplier",
  "storefront",
  "payment",
  "logistics",
  "analytics",
] as const;

export type CommerceParticipatingComponent =
  (typeof COMMERCE_PARTICIPATING_COMPONENTS)[number];

export const COMMERCE_COORDINATION_CAPABILITIES = [
  "workflow_coordination",
  "marketplace_coordination",
  "supplier_coordination",
  "storefront_coordination",
  "payment_coordination",
  "logistics_coordination",
  "analytics_coordination",
  "state_management",
  "health_coordination",
] as const;

export type CommerceCoordinationCapability =
  (typeof COMMERCE_COORDINATION_CAPABILITIES)[number];

export const COMMERCE_EXECUTION_SCOPES = [
  "workspace",
  "deployment",
  "cross_component",
  "multi_workspace",
  "cross_region",
  "distributed",
  "future_architecture",
] as const;

export type CommerceExecutionScope = (typeof COMMERCE_EXECUTION_SCOPES)[number];

export const COMMERCE_ORCHESTRATION_PLUGIN_ROLES = [
  "commerce_coordinator",
  "workflow_enricher",
  "execution_observer",
  "state_synchroniser",
  "health_monitor",
] as const;

export type CommerceOrchestrationPluginRole =
  (typeof COMMERCE_ORCHESTRATION_PLUGIN_ROLES)[number];

export const COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS = [
  "commerce_execution_history",
  "operational_coordination",
  "cross_engine_observation",
  "execution_evidence",
  "lessons_learned",
] as const;

export type CommerceOrchestrationEklsObservationKind =
  (typeof COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS)[number];

export const EXECUTIVE_AI_STATE_CONSUMERS = [
  "product-intelligence-engine",
  "market-intelligence-engine",
  "supplier-intelligence-engine",
  "financial-intelligence-engine",
  "advertising-intelligence-engine",
  "customer-intelligence-engine",
  "risk-intelligence-engine",
  "decision-intelligence-engine",
  "executive-intelligence-orchestrator",
] as const;

export type ExecutiveAiStateConsumer = (typeof EXECUTIVE_AI_STATE_CONSUMERS)[number];

const semverPattern = /^\d+\.\d+\.\d+$/;

export const commerceRegistryRefSchema = z.object({
  registryId: z.string().min(1),
  registryRowId: z.string().min(1),
});

export type CommerceRegistryRef = z.infer<typeof commerceRegistryRefSchema>;

export const commerceComponentRefSchema = z.object({
  component: z.enum(COMMERCE_PARTICIPATING_COMPONENTS),
  registryRef: commerceRegistryRefSchema,
  enabled: z.boolean(),
});

export type CommerceComponentRef = z.infer<typeof commerceComponentRefSchema>;

export const commerceOrchestrationDomainContractSchema = z.object({
  contractVersion: z.string().min(1),
  supported: z.boolean(),
  capabilityRef: z.string().optional(),
});

export type CommerceOrchestrationDomainContractRef = z.infer<
  typeof commerceOrchestrationDomainContractSchema
>;

export const commerceOrchestrationConfigurationSchema = z.object({
  schemaVersion: z.literal(COMMERCE_ORCHESTRATION_VERSION),
  executionScope: z.enum(COMMERCE_EXECUTION_SCOPES),
  participatingComponents: z.array(commerceComponentRefSchema).min(1),
  coordinationCapabilities: z.array(z.enum(COMMERCE_COORDINATION_CAPABILITIES)).min(1),
  domainContracts: z.object({
    workflow_coordination: commerceOrchestrationDomainContractSchema,
    marketplace_coordination: commerceOrchestrationDomainContractSchema,
    supplier_coordination: commerceOrchestrationDomainContractSchema,
    storefront_coordination: commerceOrchestrationDomainContractSchema,
    payment_coordination: commerceOrchestrationDomainContractSchema,
    logistics_coordination: commerceOrchestrationDomainContractSchema,
    analytics_coordination: commerceOrchestrationDomainContractSchema,
    state_management: commerceOrchestrationDomainContractSchema,
    health_coordination: commerceOrchestrationDomainContractSchema,
  }),
});

export type CommerceOrchestrationConfiguration = z.infer<
  typeof commerceOrchestrationConfigurationSchema
>;

export type CommerceOrchestrationProfileRow = {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "VALIDATED" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
  version: string;
  owner: string;
  dependencies: string[];
  capabilities: string[];
  configuration: Record<string, unknown>;
  policyRef?: string;
  pluginSupport: {
    allowPluginRegistration: boolean;
    pluginKind?: "commerce_orchestration";
    pluginId?: string;
  };
};

export const commerceOrchestrationRequestSchema = z.object({
  orchestrationId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().optional(),
  brandId: z.string().optional(),
  commerceContext: z.string().min(1),
  correlationId: z.string().min(1),
  executionScope: z.enum(COMMERCE_EXECUTION_SCOPES),
  participatingComponents: z.array(z.enum(COMMERCE_PARTICIPATING_COMPONENTS)).min(1),
  registryReferences: z.array(commerceRegistryRefSchema).min(1),
  executionState: z.enum(COMMERCE_ORCHESTRATION_STATUSES),
  timestamp: z.string().min(1),
  pillowGovernance: z.literal(true),
  brainRouted: z.literal(true),
});

export type CommerceOrchestrationRequest = z.infer<typeof commerceOrchestrationRequestSchema>;

export type CommerceOrchestrationContract = {
  profileId: string;
  profileName: string;
  version: string;
  status: CommerceOrchestrationStatus;
  capabilities: string[];
  executionScope: CommerceExecutionScope;
  participatingComponents: CommerceComponentRef[];
  coordinationCapabilities: CommerceCoordinationCapability[];
  healthStatus: CommerceHealthStatus;
  domainContracts: CommerceOrchestrationConfiguration["domainContracts"];
  policyRef?: string;
  discoverySource: "CommerceOrchestrationCatalog:registry-backed";
};

export type CommerceOrchestrationPluginManifest = {
  pluginId: string;
  pluginName: string;
  version: string;
  orchestrationProfileId: string;
  pluginRole: CommerceOrchestrationPluginRole;
  coordinationCapabilities: CommerceCoordinationCapability[];
  pillowGovernance: true;
  extensions: Record<string, unknown>;
};

export type CommerceOrchestrationPluginRecord = CommerceOrchestrationPluginManifest & {
  lifecyclePhase: CommerceOrchestrationLifecyclePhase;
  healthStatus: CommerceHealthStatus;
  registeredAt: string;
};

export type CommerceOrchestrationDiscoveryResult = {
  discoveredCount: number;
  profiles: CommerceOrchestrationContract[];
  generatedAt: string;
  discoverySource: "CommerceOrchestrationCatalog:registry-backed";
};

export type CommerceCoordinationResolution = {
  profileId: string;
  resolvedCapabilities: CommerceCoordinationCapability[];
  participatingComponents: CommerceParticipatingComponent[];
  lifecyclePhase: CommerceOrchestrationLifecyclePhase;
  policyCompliant: boolean;
  registryBacked: true;
};

export type CommerceOrchestrationStateSnapshot = {
  orchestrationId: string;
  profileId: string;
  executionState: CommerceOrchestrationStatus;
  lifecyclePhase: CommerceOrchestrationLifecyclePhase;
  participatingComponents: CommerceParticipatingComponent[];
  correlationId: string;
  capturedAt: string;
};

export type CommerceLifecycleTransitionRequest = {
  profileId: string;
  orchestrationId: string;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
  brainRouted: true;
  targetPhase: CommerceOrchestrationLifecyclePhase;
};

export type CommerceLifecycleTransitionResult = {
  profileId: string;
  orchestrationId: string;
  previousPhase: CommerceOrchestrationLifecyclePhase;
  currentPhase: CommerceOrchestrationLifecyclePhase;
  allowed: boolean;
  reason: string;
};

export type CommerceHealthSnapshot = {
  profileId: string;
  healthStatus: CommerceHealthStatus;
  lifecyclePhase: CommerceOrchestrationLifecyclePhase;
  monitoredAt: string;
  registryWired: boolean;
  policyCompliant: boolean;
};

export type CommerceBrainOrchestrationDescriptor = {
  profileId: string;
  capabilities: string[];
  coordinationCapabilities: CommerceCoordinationCapability[];
  participatingComponents: CommerceParticipatingComponent[];
  discoverySource: "CommerceOrchestrationCatalog:registry-backed";
  brainRouted: true;
};

export type CommerceEngineCoordinationEnvelope = {
  engineId: string;
  profileId: string;
  component: CommerceParticipatingComponent;
  registryRef: CommerceRegistryRef;
  coordinationCapability: CommerceCoordinationCapability;
  logicEmbedded: false;
  discoverySource: "CommerceOrchestrationCatalog:engine-coordinator";
};

export type CommerceExecutiveAiStateEnvelope = {
  consumerId: ExecutiveAiStateConsumer | string;
  profileId: string;
  orchestrationId: string;
  executionState: CommerceOrchestrationStatus;
  operationalStateOnly: true;
  reasoningEmbedded: false;
  discoverySource: "CommerceOrchestrationCatalog:executive-state-bridge";
};

export type CommerceOrchestrationEklsObservationRecord = {
  observationId: string;
  profileId: string;
  orchestrationId: string;
  workspaceId: string;
  actorId: string;
  kind: CommerceOrchestrationEklsObservationKind;
  signalValue: number;
  signalUnit: "score" | "ratio" | "count" | "latency_ms";
  summary: string;
  evidenceRef?: string;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "infrastructure-commerce";
};

export type CommerceOrchestrationEklsObservationResult = {
  accepted: boolean;
  observationId?: string;
  reason: string;
  eklsGoverned: boolean;
};
