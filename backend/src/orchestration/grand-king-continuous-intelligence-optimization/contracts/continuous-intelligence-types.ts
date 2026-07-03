/**
 * G7-06 — Grand King continuous intelligence contract types.
 */

import { z } from "zod";
import type {
  OptimizationDomainId,
  OptimizationPriority,
  OptimizationStatus,
  OptimizationType,
} from "../../../registry/types/continuous-intelligence-registry-types.js";
import {
  CONTINUOUS_INTELLIGENCE_REGISTRY_VERSION,
  OPTIMIZATION_DOMAIN_IDS,
  OPTIMIZATION_PRIORITIES,
  OPTIMIZATION_STATUSES,
  OPTIMIZATION_TYPES,
} from "../../../registry/types/continuous-intelligence-registry-types.js";

export const GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION = "g7-06-v1" as const;

export {
  OPTIMIZATION_DOMAIN_IDS,
  OPTIMIZATION_TYPES,
  OPTIMIZATION_STATUSES,
  OPTIMIZATION_PRIORITIES,
  CONTINUOUS_INTELLIGENCE_REGISTRY_VERSION,
};
export type { OptimizationDomainId, OptimizationType, OptimizationStatus, OptimizationPriority };

export const OPTIMIZATION_EKLS_KINDS = [
  "optimization_detected",
  "optimization_recommended",
  "optimization_scheduled",
  "optimization_completed",
  "optimization_learning_recorded",
] as const;

export type OptimizationEklsKind = (typeof OPTIMIZATION_EKLS_KINDS)[number];

export type OptimizationEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "anomaly" | "outcome";
  summary: string;
  ref?: string;
};

/** G7-06 — Every optimization recommendation conforms to this contract. */
export type OptimizationRecommendation = {
  optimizationId: string;
  workspaceId: string;
  targetSubsystem: string;
  optimizationType: OptimizationType;
  domainId: OptimizationDomainId;
  priority: OptimizationPriority;
  estimatedBenefit: number;
  estimatedRisk: number;
  estimatedCost: number;
  estimatedRevenueImpact: number;
  recommendedAction: string;
  approvalRequirement: string;
  implementationStatus: OptimizationStatus;
  evidence: OptimizationEvidence[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type OptimizationOpportunity = {
  opportunityId: string;
  domainId: OptimizationDomainId;
  optimizationType: OptimizationType;
  summary: string;
  ruleReference: string;
  detectedAt: string;
  signalStrength: number;
};

export type OptimizationAnomaly = {
  anomalyId: string;
  domainId: OptimizationDomainId;
  summary: string;
  ruleReference: string;
  severity: OptimizationPriority;
  detectedAt: string;
};

export type OptimizationRoiSummary = {
  totalEstimatedBenefit: number;
  totalEstimatedCost: number;
  netRoi: number;
  recommendationCount: number;
  computedAt: string;
};

export type OptimizationPriorityQueueEntry = {
  queuePosition: number;
  optimizationId: string;
  priority: OptimizationPriority;
  optimizationType: OptimizationType;
  estimatedBenefit: number;
  score: number;
};

export type OptimizationHistoryEntry = {
  entryId: string;
  optimizationId: string;
  status: OptimizationStatus;
  summary: string;
  timestamp: string;
};

export type OptimizationOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION;
  domainCount: number;
  activeRecommendations: number;
  scheduledOptimizations: number;
  completedOptimizations: number;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export const optimizationPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["detector", "optimiser", "scheduler", "analyser", "report"]),
  pillowGovernance: z.literal(true),
});

export type OptimizationPluginManifest = z.infer<typeof optimizationPluginManifestSchema>;

export const VALID_OPTIMIZATION_TRANSITIONS: Record<OptimizationStatus, OptimizationStatus[]> = {
  detected: ["analysing", "cancelled", "rejected"],
  analysing: ["recommended", "cancelled", "rejected"],
  recommended: ["approved", "rejected", "cancelled"],
  approved: ["scheduled", "executing", "cancelled"],
  scheduled: ["executing", "cancelled"],
  executing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function isValidOptimizationTransition(from: OptimizationStatus, to: OptimizationStatus): boolean {
  return VALID_OPTIMIZATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function redactOptimizationSecrets(value: unknown): unknown {
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
    return value.map(redactOptimizationSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactOptimizationSecrets(entry),
      ]),
    );
  }
  return value;
}
