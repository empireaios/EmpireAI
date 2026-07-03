/**
 * G7-01 — Grand King production workspace registry row schemas.
 */

import { z } from "zod";

export const PRODUCTION_WORKSPACE_REGISTRY_VERSION = "g7-01-v1" as const;

export const WORKSPACE_STATUSES = [
  "creating",
  "configuring",
  "ready",
  "active",
  "maintenance",
  "paused",
  "degraded",
  "blocked",
  "archived",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const WORKSPACE_TYPES = ["executive", "production"] as const;

export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export type ProductionWorkspaceRegistryRowBase = {
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
  validation: { schemaVersion: typeof PRODUCTION_WORKSPACE_REGISTRY_VERSION };
  pluginSupport: { allowPluginRegistration: boolean };
  workspaceScope: { scope: "global" | "workspace" };
  futureCompatibility: { notes: string };
};

export const productionWorkspaceConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  workspaceId: z.string().min(1),
  workspaceName: z.string().min(1),
  workspaceType: z.enum(WORKSPACE_TYPES),
  ownerId: z.string().min(1),
  brandIds: z.array(z.string()).min(1),
  environment: z.literal("production"),
  primaryBrand: z.string().min(1),
  readinessPolicyRef: z.string().optional(),
  commercePolicyRef: z.string().optional(),
  automationWorkflowRef: z.string().optional(),
  connectionProviderRefs: z.array(z.string()).default([]),
  identityRef: z.string().optional(),
});

export const readinessPolicyConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  readinessSignals: z.array(z.string()).default([]),
  blockerConditions: z.array(z.string()).default([]),
  certificationProgrammeRef: z.string().optional(),
});

export const connectionProviderConfigurationSchema = z.object({
  schemaVersion: z.union([
    z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
    z.literal("g8-01-v1"),
  ]),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  providerKind: z.string().min(1),
  registryRef: z.string().optional(),
  sandboxOnly: z.boolean().default(false),
  channelType: z.string().optional(),
  defaultOperationType: z.string().optional(),
  supportedOperationTypes: z.array(z.string()).default([]),
});

export const identityProviderConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  providerKind: z.literal("identity"),
  registryRef: z.string().optional(),
  authorizationScopes: z.array(z.string()).default([]),
});

export const executivePolicyConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  kpiMetricRefs: z.array(z.string()).default([]),
  decisionRuleRefs: z.array(z.string()).default([]),
  riskScoringRefs: z.array(z.string()).default([]),
  approvalChainRef: z.string().optional(),
  escalationPolicyRef: z.string().optional(),
});

export const financialPolicyConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  defaultCurrency: z.string().min(3).max(3),
  feeRateRefs: z.array(z.string()).default([]),
  taxRateRefs: z.array(z.string()).default([]),
  domainRefs: z.array(z.string()).default([]),
  kpiMetricRefs: z.array(z.string()).default([]),
  reconciliationPolicyRef: z.string().optional(),
});

export const optimizationPolicyConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  policyId: z.string().min(1),
  policyName: z.string().min(1),
  domainRefs: z.array(z.string()).default([]),
  optimizationTypeRefs: z.array(z.string()).default([]),
  opportunityRuleRefs: z.array(z.string()).default([]),
  anomalyRuleRefs: z.array(z.string()).default([]),
  prioritizationRuleRefs: z.array(z.string()).default([]),
  schedulerPolicyRef: z.string().optional(),
  approvalChainRef: z.string().optional(),
});

export const identityMonitorConfigurationSchema = z.object({
  schemaVersion: z.literal(PRODUCTION_WORKSPACE_REGISTRY_VERSION),
  monitorId: z.string().min(1),
  monitorName: z.string().min(1),
  identityProviderRef: z.string().optional(),
  healthSignalRefs: z.array(z.string()).default([]),
  degradationRuleRefs: z.array(z.string()).default([]),
  recoveryRuleRefs: z.array(z.string()).default([]),
});
