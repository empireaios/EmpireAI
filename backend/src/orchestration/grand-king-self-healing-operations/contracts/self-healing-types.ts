/**
 * G7-08 — Grand King self-healing contract types.
 */

import { z } from "zod";
import type {
  HealingAction,
  HealingExecutionStatus,
  HealthState,
  SelfHealingDomainId,
} from "../../../registry/types/self-healing-registry-types.js";
import {
  HEALING_ACTIONS,
  HEALING_EXECUTION_STATUSES,
  HEALTH_STATES,
  SELF_HEALING_DOMAIN_IDS,
  SELF_HEALING_REGISTRY_VERSION,
} from "../../../registry/types/self-healing-registry-types.js";

export const GRAND_KING_SELF_HEALING_OPERATIONS_VERSION = "g7-08-v1" as const;

export {
  SELF_HEALING_DOMAIN_IDS,
  HEALTH_STATES,
  HEALING_ACTIONS,
  HEALING_EXECUTION_STATUSES,
  SELF_HEALING_REGISTRY_VERSION,
};
export type { SelfHealingDomainId, HealthState, HealingAction, HealingExecutionStatus };

export const SELF_HEALING_EKLS_KINDS = [
  "self_healing_started",
  "self_healing_completed",
  "self_healing_failed",
  "self_healing_cancelled",
  "self_healing_learning_recorded",
  "production_health_restored",
] as const;

export type SelfHealingEklsKind = (typeof SELF_HEALING_EKLS_KINDS)[number];

export type HealingEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "recovery" | "rollback";
  summary: string;
  ref?: string;
};

/** G7-08 — Every healing action conforms to this contract. */
export type HealingActionRecord = {
  healingId: string;
  workspaceId: string;
  targetSubsystem: string;
  domainId: SelfHealingDomainId;
  failureReference: string;
  recoveryReference: string;
  healingAction: HealingAction;
  confidenceScore: number;
  approvalRequirement: string;
  executionStatus: HealingExecutionStatus;
  result: string;
  rollbackReference: string;
  evidence: HealingEvidence[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type HealthDegradationSignal = {
  signalId: string;
  domainId: SelfHealingDomainId;
  healthState: HealthState;
  summary: string;
  ruleReference: string;
  detectedAt: string;
};

export type HealingRecommendation = {
  recommendationId: string;
  domainId: SelfHealingDomainId;
  healingAction: HealingAction;
  summary: string;
  confidenceScore: number;
  ruleReference: string;
};

export type SelfHealingOverview = {
  frameworkVersion: typeof GRAND_KING_SELF_HEALING_OPERATIONS_VERSION;
  domainCount: number;
  activeHealings: number;
  completedHealings: number;
  failedHealings: number;
  overallHealth: HealthState;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export type HealingQueueEntry = {
  queuePosition: number;
  healingId: string;
  domainId: SelfHealingDomainId;
  healingAction: HealingAction;
  confidenceScore: number;
  executionStatus: HealingExecutionStatus;
};

export type RecoveryConfidenceSummary = {
  averageConfidence: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
  computedAt: string;
};

export type SelfHealingStatistics = {
  totalHealings: number;
  successRate: number;
  restoredHealthCount: number;
  activeRecoveries: number;
  computedAt: string;
};

export const selfHealingPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "health_analyser",
    "healing_strategy",
    "recovery_planner",
    "rollback_planner",
    "dependency_analyser",
    "confidence_scorer",
  ]),
  pillowGovernance: z.literal(true),
});

export type SelfHealingPluginManifest = z.infer<typeof selfHealingPluginManifestSchema>;

export const VALID_HEALING_TRANSITIONS: Record<HealingExecutionStatus, HealingExecutionStatus[]> = {
  waiting: ["recommended", "approval_pending", "cancelled"],
  recommended: ["approval_pending", "executing", "cancelled"],
  approval_pending: ["executing", "cancelled"],
  executing: ["completed", "failed", "paused", "cancelled"],
  completed: [],
  failed: ["executing", "cancelled"],
  cancelled: [],
  paused: ["executing", "cancelled"],
};

export function isValidHealingTransition(from: HealingExecutionStatus, to: HealingExecutionStatus): boolean {
  return VALID_HEALING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function redactSelfHealingSecrets(value: unknown): unknown {
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
  if (Array.isArray(value)) return value.map(redactSelfHealingSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redactSelfHealingSecrets(v)]),
    );
  }
  return value;
}
