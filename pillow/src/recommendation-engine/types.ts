/** PILLOW-REC-001 — Recommendation Engine types (T2-09). */

import type {
  ENGINE_STATUSES,
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_SEVERITIES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";

export type RecommendationEngineVersion = "PILLOW-REC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];
export type RecommendationSeverity = (typeof RECOMMENDATION_SEVERITIES)[number];
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export type RedesignProposal = {
  recommendationId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  recommendationCategory: RecommendationCategory;
  recommendationTitle: string;
  recommendationDescription: string;
  affectedComponents: string[];
  affectedLayoutRegions: string[];
  affectedNavigationNodes: string[];
  sourceUxScoreId: string | null;
  sourceFindingIds: string[];
  evidenceReferences: string[];
  expectedUxBenefit: string;
  priority: RecommendationPriority;
  severity: RecommendationSeverity;
  confidenceScore: number;
  executivePreferenceAlignment: boolean;
  designSystemAlignment: boolean;
  metadataVersion: string;
};

export type RecommendationRecord = {
  recommendationRecordId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceUxScoreId: string | null;
  sourceUxRuleResultIds: string[];
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  sourceLayoutEvaluationId: string | null;
  sourceWorkflowOptimizationId: string | null;
  sourceAccessibilityReviewId: string | null;
  sourceConsistencyReviewId: string | null;
  proposals: RedesignProposal[];
  prioritizedProposalIds: string[];
  evidenceReferences: string[];
  overallPriority: RecommendationPriority;
  confidenceScore: number;
  metadataVersion: string;
};

export type RecommendationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  proposalsValidated: number;
  categoriesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RecommendationReport = {
  recommendationReportId: string;
  recommendationTimestamp: string;
  record: RecommendationRecord;
  validation: RecommendationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RecommendationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  recommendationEnabled: boolean;
  reportsGenerated: number;
  lastReportAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type RecommendationPerformanceStats = {
  totalReports: number;
  successfulReports: number;
  failedReports: number;
  totalProposalsGenerated: number;
  averageProposalsPerReport: number;
  averageReportDurationMs: number;
  peakReportDurationMs: number;
};

export type RecommendationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RecommendationEngineState = {
  engineVersion: RecommendationEngineVersion;
  missionId: "T2-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: RecommendationEngineConfiguration;
  latestRecord: RecommendationRecord | null;
  latestReport: RecommendationReport | null;
  health: RecommendationHealthReport;
  performance: RecommendationPerformanceStats;
};

export type RecommendationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  proposalsCount: number;
  criticalCount: number;
  highPriorityCount: number;
  confidenceScore: number;
  totalReports: number;
  recentLogs: string[];
};
