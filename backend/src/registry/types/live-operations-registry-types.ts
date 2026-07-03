/**
 * G7-00 — Grand King live operations registry row schemas (REG-LIVE-OPERATIONS-*).
 */

import { z } from "zod";

export const LIVE_OPERATIONS_REGISTRY_VERSION = "g7-00-v1" as const;

export const LIVE_OPERATION_DOMAINS = [
  "grand_king_account",
  "luminousyou_brand",
  "amazon_operations",
  "stripe_operations",
  "storefront_operations",
  "supplier_operations",
  "payment_operations",
  "automation_operations",
  "executive_monitoring",
  "incident_tracking",
  "outcome_learning",
] as const;

export type LiveOperationDomainId = (typeof LIVE_OPERATION_DOMAINS)[number];

export const LIVE_OPERATION_STATES = [
  "not_started",
  "ready",
  "active",
  "paused",
  "blocked",
  "degraded",
  "incident",
  "completed",
  "archived",
  "unknown",
] as const;

export type LiveOperationState = (typeof LIVE_OPERATION_STATES)[number];

export const LIVE_ENVIRONMENTS = ["production", "live_controlled"] as const;

export type LiveEnvironment = (typeof LIVE_ENVIRONMENTS)[number];

export type LiveOperationsRegistryRowBase = {
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
  validation: { schemaVersion: typeof LIVE_OPERATIONS_REGISTRY_VERSION };
  pluginSupport: { allowPluginRegistration: boolean };
  workspaceScope: { scope: "global" | "workspace" };
  futureCompatibility: { notes: string };
};

export const liveOperationDomainConfigurationSchema = z.object({
  schemaVersion: z.literal(LIVE_OPERATIONS_REGISTRY_VERSION),
  domainId: z.enum(LIVE_OPERATION_DOMAINS),
  operationType: z.string().min(1),
  certificationRegistryRef: z.string().optional(),
  commerceRegistryRef: z.string().optional(),
  automationRegistryRef: z.string().optional(),
  identityRegistryRef: z.string().optional(),
  readinessPolicyRef: z.string().optional(),
  providerRef: z.string().optional(),
});

export const grandKingOperatingProfileConfigurationSchema = z.object({
  schemaVersion: z.literal(LIVE_OPERATIONS_REGISTRY_VERSION),
  profileKind: z.literal("grand_king_operating"),
  accountHolderId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  brandId: z.string().min(1),
  brandName: z.string().min(1),
  accountName: z.string().min(1),
  isProductionOperator: z.literal(true),
  certificationProgrammeRef: z.string().min(1),
});

export const liveEnvironmentProfileConfigurationSchema = z.object({
  schemaVersion: z.literal(LIVE_OPERATIONS_REGISTRY_VERSION),
  profileKind: z.literal("live_environment"),
  environment: z.enum(LIVE_ENVIRONMENTS),
  controlledLiveBoundary: z.literal(true),
  requiresProductionCertification: z.literal(true),
  readinessPolicyRef: z.string().min(1),
});

export const LIVE_CERTIFICATION_DOMAIN_IDS = [
  "grand_king_workspace",
  "commerce_operations",
  "automation_operations",
  "executive_operations",
  "financial_operations",
  "continuous_optimization",
  "autonomous_operations",
  "self_healing_operations",
  "operational_intelligence",
  "production_stability",
  "production_governance",
  "operational_risks",
  "operational_evidence",
  "grand_king_readiness",
  "version1_launch_eligibility",
] as const;

export type LiveCertificationDomainId = (typeof LIVE_CERTIFICATION_DOMAIN_IDS)[number];

export const LIVE_LAUNCH_OUTCOMES = [
  "LIVE_READY",
  "LIVE_READY_WITH_CONDITIONS",
  "LIVE_BLOCKED",
  "LIVE_FAILED",
  "UNKNOWN",
] as const;

export type LiveLaunchOutcome = (typeof LIVE_LAUNCH_OUTCOMES)[number];

export const FINAL_LIVE_CERTIFICATION_RULE_KINDS = [
  "live_operations_framework",
  "production_workspace",
  "commerce_operations",
  "automation_operations",
  "executive_operations",
  "financial_operations",
  "continuous_optimization",
  "autonomous_operations",
  "self_healing_operations",
  "operational_intelligence",
  "production_stability",
  "production_governance",
  "operational_risks",
  "operational_evidence",
  "grand_king_readiness",
  "version1_launch_eligibility",
  "evidence_completeness",
  "launch_gate",
] as const;

export type FinalLiveCertificationRuleKind = (typeof FINAL_LIVE_CERTIFICATION_RULE_KINDS)[number];

export const finalLiveCertificationRuleConfigurationSchema = z.object({
  schemaVersion: z.literal(LIVE_OPERATIONS_REGISTRY_VERSION),
  ruleKind: z.enum(FINAL_LIVE_CERTIFICATION_RULE_KINDS),
  certificationDomain: z.enum(LIVE_CERTIFICATION_DOMAIN_IDS),
  missionRef: z.string().min(1),
  scanResolverRef: z.string().min(1),
  artifactRef: z.string().optional(),
  auditMissionRefs: z.array(z.string()).default([]),
});
