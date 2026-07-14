/** PILLOW-VCE-001 — Visual Consistency Engine types (T2-07). */

import type {
  CONSISTENCY_CATEGORIES,
  FINDING_SEVERITIES,
  REVIEW_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";

export type VisualConsistencyEngineVersion = "PILLOW-VCE-001";
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export type ConsistencyCategory = (typeof CONSISTENCY_CATEGORIES)[number];

export type ConsistencyFinding = {
  findingId: string;
  findingCategory: ConsistencyCategory;
  findingDescription: string;
  severity: FindingSeverity;
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  affectedNavigationNodeId: string | null;
  expectedPattern: string | null;
  observedPattern: string | null;
  evidenceMetadata: Record<string, unknown>;
  detectionConfidence: number;
  timestamp: string;
  metadataVersion: string;
};

export type ConsistencyStrength = {
  strengthId: string;
  category: string;
  description: string;
  affectedComponentIds: string[];
  evidenceRef: string;
  confidence: number;
};

export type ConsistencyReviewRecord = {
  consistencyReviewId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceUiStateId: string | null;
  sourceComponentSetId: string | null;
  sourceLayoutId: string | null;
  sourceNavigationGraphId: string | null;
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  sourceLayoutEvaluationId: string | null;
  sourceAccessibilityReviewId: string | null;
  consistencyFindings: ConsistencyFinding[];
  consistencyStrengths: ConsistencyStrength[];
  affectedComponents: string[];
  affectedLayoutRegions: string[];
  affectedNavigationNodes: string[];
  evidenceReferences: string[];
  severity: FindingSeverity;
  confidenceScore: number;
  metadataVersion: string;
};

export type ConsistencyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  reviewsValidated: number;
  findingsDetected: number;
  strengthsIdentified: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ConsistencyReviewReport = {
  reviewReportId: string;
  reviewTimestamp: string;
  record: ConsistencyReviewRecord;
  validation: ConsistencyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ConsistencyHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  reviewEnabled: boolean;
  reviewsCompleted: number;
  lastReviewAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ConsistencyPerformanceStats = {
  totalReviews: number;
  successfulReviews: number;
  failedReviews: number;
  totalFindingsDetected: number;
  totalStrengthsIdentified: number;
  averageReviewDurationMs: number;
  peakReviewDurationMs: number;
};

export type ConsistencyLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type VisualConsistencyState = {
  engineVersion: VisualConsistencyEngineVersion;
  missionId: "T2-07";
  status: ReviewStatus;
  initializedAt: string;
  configuration: VisualConsistencyConfiguration;
  latestRecord: ConsistencyReviewRecord | null;
  latestReport: ConsistencyReviewReport | null;
  health: ConsistencyHealthReport;
  performance: ConsistencyPerformanceStats;
};

export type VisualConsistencyCockpitSnapshot = {
  reviewStatus: ReviewStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  findingsCount: number;
  strengthsCount: number;
  severity: FindingSeverity | null;
  confidenceScore: number;
  totalReviews: number;
  recentLogs: string[];
};
