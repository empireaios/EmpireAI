/**
 * G7-02 — Grand King commerce operations contract types.
 */

import { z } from "zod";
import type { CommerceOperationState, CommerceOperationType } from "../../../registry/types/commerce-operations-registry-types.js";
import {
  COMMERCE_OPERATION_STATES,
  COMMERCE_OPERATION_TYPES,
  COMMERCE_OPERATIONS_REGISTRY_VERSION,
} from "../../../registry/types/commerce-operations-registry-types.js";

export const GRAND_KING_COMMERCE_OPERATIONS_VERSION = "g7-02-v1" as const;

export { COMMERCE_OPERATION_STATES, COMMERCE_OPERATION_TYPES, COMMERCE_OPERATIONS_REGISTRY_VERSION };
export type { CommerceOperationState, CommerceOperationType };

export const COMMERCE_OPERATIONS_EKLS_KINDS = [
  "commerce_operation_started",
  "commerce_operation_paused",
  "commerce_operation_resumed",
  "commerce_operation_stopped",
  "commerce_operation_completed",
  "commerce_operation_incident",
  "commerce_operation_learning",
] as const;

export type CommerceOperationsEklsKind = (typeof COMMERCE_OPERATIONS_EKLS_KINDS)[number];

export type CommerceOperationEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "redacted" | "outcome";
  summary: string;
  ref?: string;
};

export type CommerceOperationRisk = {
  riskId: string;
  providerId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  summary: string;
  mitigation?: string;
};

export type CommerceOperationBlocker = {
  blockerId: string;
  providerId: string;
  severity: CommerceOperationRisk["severity"];
  message: string;
  recommendation?: string;
};

/** G7-02 — Every commerce operation conforms to this contract. */
export type CommerceOperation = {
  operationId: string;
  workspaceId: string;
  brandId: string;
  providerId: string;
  channelType: string;
  operationType: CommerceOperationType | string;
  status: CommerceOperationState;
  readinessReference: string;
  authorizationReference: string;
  automationReference: string;
  healthReference: string;
  evidence: CommerceOperationEvidence[];
  risks: CommerceOperationRisk[];
  blockers: CommerceOperationBlocker[];
  startedAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type CommerceOperationRun = {
  runId: string;
  correlationId: string;
  operations: CommerceOperation[];
  runningCount: number;
  blockedCount: number;
  scannedAt: string;
  discoverySource: "REG-CONNECTION-PROVIDER";
};

export type CommerceOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_COMMERCE_OPERATIONS_VERSION;
  providerCount: number;
  operationCount: number;
  runningOperations: number;
  productionEligible: boolean;
  workspaceId: string;
  brandId: string;
  generatedAt: string;
};

export type CommerceOperationHealthSummary = {
  score: number;
  healthy: boolean;
  status: CommerceOperationState;
  signals: string[];
  blockers: CommerceOperationBlocker[];
};

export type CommerceOperationDependencySummary = {
  readinessPolicy: string;
  commercePolicy: string;
  automationWorkflow: string;
  identityProvider: string;
  connectionProviders: string[];
};

export const VALID_COMMERCE_OPERATION_TRANSITIONS: Record<CommerceOperationState, CommerceOperationState[]> = {
  not_ready: ["ready", "blocked"],
  ready: ["starting", "blocked"],
  starting: ["running", "blocked", "incident"],
  running: ["paused", "degraded", "blocked", "incident", "stopping"],
  paused: ["running", "stopping", "blocked"],
  degraded: ["running", "blocked", "incident", "stopping"],
  blocked: ["ready", "not_ready"],
  incident: ["running", "stopping", "blocked"],
  stopping: ["stopped", "blocked"],
  stopped: ["ready", "completed"],
  completed: [],
};

export function isValidCommerceOperationTransition(
  from: CommerceOperationState,
  to: CommerceOperationState,
): boolean {
  return VALID_COMMERCE_OPERATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const commerceOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["marketplace", "supplier", "payment", "logistics", "analytics", "controller"]),
  pillowGovernance: z.literal(true),
});

export type CommerceOperationsPluginManifest = z.infer<typeof commerceOperationsPluginManifestSchema>;
