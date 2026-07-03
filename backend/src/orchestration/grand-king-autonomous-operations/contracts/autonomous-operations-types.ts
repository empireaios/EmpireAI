/**
 * G7-07 — Grand King autonomous operations contract types.
 */

import { z } from "zod";
import type {
  AutonomousDomainId,
  AutonomousExecutionStatus,
  AutonomousHealthStatus,
  AutonomousOperationType,
  AutonomyLevel,
} from "../../../registry/types/autonomous-operations-registry-types.js";
import {
  AUTONOMOUS_DOMAIN_IDS,
  AUTONOMOUS_EXECUTION_STATUSES,
  AUTONOMOUS_HEALTH_STATUSES,
  AUTONOMOUS_OPERATION_TYPES,
  AUTONOMOUS_OPERATIONS_REGISTRY_VERSION,
  AUTONOMY_LEVELS,
} from "../../../registry/types/autonomous-operations-registry-types.js";

export const GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION = "g7-07-v1" as const;

export {
  AUTONOMOUS_DOMAIN_IDS,
  AUTONOMOUS_EXECUTION_STATUSES,
  AUTONOMOUS_HEALTH_STATUSES,
  AUTONOMOUS_OPERATION_TYPES,
  AUTONOMY_LEVELS,
  AUTONOMOUS_OPERATIONS_REGISTRY_VERSION,
};
export type {
  AutonomousDomainId,
  AutonomousExecutionStatus,
  AutonomousHealthStatus,
  AutonomousOperationType,
  AutonomyLevel,
};

export const AUTONOMOUS_EKLS_KINDS = [
  "autonomous_operation_started",
  "autonomous_operation_completed",
  "autonomous_operation_cancelled",
  "autonomous_operation_failed",
  "autonomous_operation_recovered",
  "autonomous_learning_recorded",
] as const;

export type AutonomousEklsKind = (typeof AUTONOMOUS_EKLS_KINDS)[number];

export type AutonomousEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "outcome" | "rollback";
  summary: string;
  ref?: string;
};

/** G7-07 — Every autonomous operation conforms to this contract. */
export type AutonomousOperation = {
  autonomousOperationId: string;
  workspaceId: string;
  brandId: string;
  operationType: AutonomousOperationType;
  domainId: AutonomousDomainId;
  autonomyLevel: AutonomyLevel;
  approvalPolicy: string;
  executionStatus: AutonomousExecutionStatus;
  healthStatus: AutonomousHealthStatus;
  riskScore: number;
  estimatedImpact: number;
  recommendedAction: string;
  executedAction?: string;
  rollbackReference: string;
  evidence: AutonomousEvidence[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type AutonomousOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION;
  domainCount: number;
  activeOperations: number;
  queuedOperations: number;
  pausedOperations: number;
  failedOperations: number;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export type AutonomousQueueEntry = {
  queuePosition: number;
  autonomousOperationId: string;
  operationType: AutonomousOperationType;
  autonomyLevel: AutonomyLevel;
  executionStatus: AutonomousExecutionStatus;
  riskScore: number;
};

export type AutonomousHistoryEntry = {
  entryId: string;
  autonomousOperationId: string;
  executionStatus: AutonomousExecutionStatus;
  summary: string;
  timestamp: string;
};

export type AutonomousHealthSummary = {
  overallHealth: AutonomousHealthStatus;
  healthyCount: number;
  degradedCount: number;
  criticalCount: number;
  monitoredOperations: number;
  computedAt: string;
};

export type AutonomousRecommendation = {
  recommendationId: string;
  domainId: AutonomousDomainId;
  summary: string;
  recommendedAction: string;
  autonomyLevel: AutonomyLevel;
  ruleReference: string;
};

export const autonomousOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["executor", "scheduler", "validator", "monitor", "analyser"]),
  pillowGovernance: z.literal(true),
});

export type AutonomousOperationsPluginManifest = z.infer<typeof autonomousOperationsPluginManifestSchema>;

export const VALID_AUTONOMOUS_TRANSITIONS: Record<AutonomousExecutionStatus, AutonomousExecutionStatus[]> = {
  waiting: ["scheduled", "approval_pending", "blocked", "cancelled"],
  scheduled: ["running", "paused", "cancelled", "blocked"],
  running: ["completed", "failed", "paused", "cancelled"],
  paused: ["running", "cancelled", "scheduled"],
  blocked: ["waiting", "cancelled", "approval_pending"],
  approval_pending: ["scheduled", "running", "cancelled"],
  completed: [],
  cancelled: [],
  failed: ["recovered", "waiting"],
  recovered: ["waiting", "scheduled"],
};

export function isValidAutonomousTransition(
  from: AutonomousExecutionStatus,
  to: AutonomousExecutionStatus,
): boolean {
  return VALID_AUTONOMOUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function redactAutonomousSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactAutonomousSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactAutonomousSecrets(entry),
      ]),
    );
  }
  return value;
}
