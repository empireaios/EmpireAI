/**
 * G7-09 — Grand King operational intelligence contract types.
 */

import { z } from "zod";
import type {
  ExecutiveKpiId,
  InsightPriority,
  InsightSeverity,
  InsightType,
  IntelligenceDomainId,
} from "../../../registry/types/operational-intelligence-registry-types.js";
import {
  EXECUTIVE_KPI_IDS,
  INSIGHT_PRIORITIES,
  INSIGHT_SEVERITIES,
  INSIGHT_TYPES,
  INTELLIGENCE_DOMAIN_IDS,
  OPERATIONAL_INTELLIGENCE_REGISTRY_VERSION,
} from "../../../registry/types/operational-intelligence-registry-types.js";

export const GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION = "g7-09-v1" as const;

export {
  INTELLIGENCE_DOMAIN_IDS,
  INSIGHT_TYPES,
  INSIGHT_SEVERITIES,
  INSIGHT_PRIORITIES,
  EXECUTIVE_KPI_IDS,
  OPERATIONAL_INTELLIGENCE_REGISTRY_VERSION,
};
export type { IntelligenceDomainId, InsightType, InsightSeverity, InsightPriority, ExecutiveKpiId };

export const OPERATIONAL_INTELLIGENCE_EKLS_KINDS = [
  "executive_insight_generated",
  "executive_prediction_recorded",
  "trend_detected",
  "anomaly_detected",
  "recommendation_generated",
  "executive_learning_recorded",
] as const;

export type OperationalIntelligenceEklsKind = (typeof OPERATIONAL_INTELLIGENCE_EKLS_KINDS)[number];

export type SupportingEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "correlation" | "kpi" | "trend";
  summary: string;
  ref?: string;
};

/** G7-09 — Every insight conforms to this contract. */
export type ExecutiveInsight = {
  insightId: string;
  workspaceId: string;
  category: InsightType;
  severity: InsightSeverity;
  priority: InsightPriority;
  sourceSubsystems: string[];
  domainId: IntelligenceDomainId;
  confidenceScore: number;
  businessImpact: number;
  financialImpact: number;
  recommendedAction: string;
  predictedOutcome: string;
  supportingEvidence: SupportingEvidence[];
  createdAt: string;
  updatedAt: string;
  correlationId: string;
  governanceState: string;
};

export type ExecutiveTrend = {
  trendId: string;
  domainId: IntelligenceDomainId;
  summary: string;
  direction: "up" | "down" | "stable";
  ruleReference: string;
  detectedAt: string;
  signalStrength: number;
};

export type ExecutiveOpportunity = {
  opportunityId: string;
  domainId: IntelligenceDomainId;
  summary: string;
  ruleReference: string;
  detectedAt: string;
  estimatedValue: number;
};

export type ExecutiveAnomaly = {
  anomalyId: string;
  domainId: IntelligenceDomainId;
  summary: string;
  ruleReference: string;
  severity: InsightSeverity;
  detectedAt: string;
};

export type ExecutivePrediction = {
  predictionId: string;
  domainId: IntelligenceDomainId;
  summary: string;
  predictedOutcome: string;
  confidenceScore: number;
  ruleReference: string;
  predictedAt: string;
};

export type ExecutiveKpiSnapshot = {
  kpiId: ExecutiveKpiId;
  label: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  ruleReference: string;
  computedAt: string;
};

export type EmpireHealthScore = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  kpiContributions: Array<{ kpiId: ExecutiveKpiId; contribution: number }>;
  computedAt: string;
};

export type ExecutiveBriefing = {
  briefingId: string;
  title: string;
  summary: string;
  keyInsights: string[];
  topRecommendations: string[];
  riskHighlights: string[];
  empireHealthScore: number;
  generatedAt: string;
};

export type CrossSystemCorrelation = {
  correlationId: string;
  sourceSubsystems: string[];
  summary: string;
  strength: number;
  ruleReference: string;
  detectedAt: string;
};

export type OperationalIntelligenceOverview = {
  frameworkVersion: typeof GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION;
  domainCount: number;
  activeInsights: number;
  predictionsCount: number;
  recommendationsCount: number;
  empireHealthScore: number;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export const operationalIntelligencePluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum([
    "insight_provider",
    "prediction_engine",
    "trend_analyser",
    "business_analyser",
    "recommendation_provider",
    "kpi_provider",
  ]),
  pillowGovernance: z.literal(true),
});

export type OperationalIntelligencePluginManifest = z.infer<typeof operationalIntelligencePluginManifestSchema>;

export function redactOperationalIntelligenceSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (
      lower.includes("sk_live") ||
      lower.includes("api_key") ||
      lower.includes("password") ||
      lower.includes("secret") ||
      lower.includes("token") ||
      lower.includes("credential") ||
      lower.includes("pii") ||
      lower.includes("ssn")
    ) {
      return "[REDACTED]";
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(redactOperationalIntelligenceSecrets);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        redactOperationalIntelligenceSecrets(entry),
      ]),
    );
  }
  return value;
}
