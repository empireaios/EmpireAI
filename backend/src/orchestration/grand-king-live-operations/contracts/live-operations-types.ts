/**
 * G7-00 — Grand King live operations contract types.
 */

import { z } from "zod";
import type {
  LiveEnvironment,
  LiveOperationDomainId,
  LiveOperationState,
} from "../../../registry/types/live-operations-registry-types.js";
import {
  LIVE_OPERATION_STATES,
  LIVE_OPERATIONS_REGISTRY_VERSION,
} from "../../../registry/types/live-operations-registry-types.js";

export const GRAND_KING_LIVE_OPERATIONS_VERSION = "g7-00-v1" as const;

export { LIVE_OPERATION_STATES, LIVE_OPERATIONS_REGISTRY_VERSION };
export type { LiveOperationState, LiveOperationDomainId, LiveEnvironment };

export const LIVE_OPERATIONS_EKLS_KINDS = [
  "live_operation_started",
  "live_operation_paused",
  "live_operation_resumed",
  "live_operation_blocked",
  "live_operation_incident",
  "live_operation_completed",
  "live_operation_evidence_recorded",
] as const;

export type LiveOperationsEklsKind = (typeof LIVE_OPERATIONS_EKLS_KINDS)[number];

export type LiveOperationEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "redacted" | "outcome";
  summary: string;
  ref?: string;
};

export type LiveOperationRisk = {
  riskId: string;
  domainId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  summary: string;
  mitigation?: string;
};

export type LiveOperationBlocker = {
  blockerId: string;
  domainId: string;
  severity: LiveOperationRisk["severity"];
  message: string;
  recommendation?: string;
};

export type ProviderReference = { providerId: string; ref: string };
export type AutomationReference = { workflowId: string; ref: string };
export type CommerceReference = { registryId: string; ref: string };

/** G7-00 — Every live operation conforms to this contract. */
export type LiveOperation = {
  operationId: string;
  workspaceId: string;
  accountHolderId: string;
  companyId: string;
  brandId: string;
  environment: LiveEnvironment;
  operationType: string;
  status: LiveOperationState;
  readinessReference: string;
  certificationReference: string;
  providerReferences: ProviderReference[];
  automationReferences: AutomationReference[];
  commerceReferences: CommerceReference[];
  evidence: LiveOperationEvidence[];
  risks: LiveOperationRisk[];
  blockers: LiveOperationBlocker[];
  startedAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type LiveOperationRun = {
  runId: string;
  correlationId: string;
  operations: LiveOperation[];
  activeCount: number;
  blockedCount: number;
  scannedAt: string;
  discoverySource: "REG-LIVE-OPERATIONS-DOMAIN";
};

export type LiveOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_LIVE_OPERATIONS_VERSION;
  domainCount: number;
  operationCount: number;
  activeOperations: number;
  productionEligible: boolean;
  grandKingProfileId: string;
  environmentProfileId: string;
  generatedAt: string;
};

export type GrandKingOperatingProfile = {
  profileId: string;
  accountHolderId: string;
  workspaceId: string;
  companyId: string;
  brandId: string;
  brandName: string;
  accountName: string;
  isProductionOperator: true;
  certificationProgrammeRef: string;
};

export type LiveEnvironmentProfile = {
  profileId: string;
  environment: LiveEnvironment;
  controlledLiveBoundary: true;
  requiresProductionCertification: true;
  readinessPolicyRef: string;
};

export const liveOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["domain", "evidence_collector", "state_validator"]),
  pillowGovernance: z.literal(true),
});

export type LiveOperationsPluginManifest = z.infer<typeof liveOperationsPluginManifestSchema>;

export const VALID_STATE_TRANSITIONS: Record<LiveOperationState, LiveOperationState[]> = {
  not_started: ["ready", "blocked", "unknown"],
  ready: ["active", "blocked", "unknown"],
  active: ["paused", "blocked", "degraded", "incident", "completed"],
  paused: ["active", "blocked", "archived"],
  blocked: ["ready", "archived"],
  degraded: ["active", "paused", "incident", "blocked"],
  incident: ["paused", "blocked", "active", "completed"],
  completed: ["archived"],
  archived: [],
  unknown: ["ready", "blocked"],
};

export function isValidLiveOperationTransition(from: LiveOperationState, to: LiveOperationState): boolean {
  return VALID_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
