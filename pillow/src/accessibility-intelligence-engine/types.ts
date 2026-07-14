/** PILLOW-AII-001 — Accessibility Intelligence types (T2-06). */

import type {
  ACCESSIBILITY_CATEGORIES,
  FINDING_SEVERITIES,
  REVIEW_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";

export type AccessibilityIntelligenceEngineVersion = "PILLOW-AII-001";
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];
export type AccessibilityCategory = (typeof ACCESSIBILITY_CATEGORIES)[number];

export type AccessibilityFinding = {
  findingId: string;
  findingCategory: AccessibilityCategory;
  findingDescription: string;
  severity: FindingSeverity;
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  affectedNavigationNodeId: string | null;
  evidenceMetadata: Record<string, unknown>;
  detectionConfidence: number;
  timestamp: string;
  metadataVersion: string;
};

export type AccessibilityStrength = {
  strengthId: string;
  category: string;
  description: string;
  affectedComponentIds: string[];
  evidenceRef: string;
  confidence: number;
};

export type AccessibilityReviewRecord = {
  accessibilityReviewId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceUiStateId: string | null;
  sourceComponentSetId: string | null;
  sourceLayoutId: string | null;
  sourceNavigationGraphId: string | null;
  sourceWorkflowContextId: string | null;
  sourceWorkflowOptimizationId: string | null;
  accessibilityFindings: AccessibilityFinding[];
  accessibilityStrengths: AccessibilityStrength[];
  affectedComponents: string[];
  affectedLayoutRegions: string[];
  affectedNavigationNodes: string[];
  evidenceReferences: string[];
  severity: FindingSeverity;
  confidenceScore: number;
  metadataVersion: string;
};

export type AccessibilityValidationReport = {
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

export type AccessibilityReviewReport = {
  reviewReportId: string;
  reviewTimestamp: string;
  record: AccessibilityReviewRecord;
  validation: AccessibilityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AccessibilityHealthReport = {
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

export type AccessibilityPerformanceStats = {
  totalReviews: number;
  successfulReviews: number;
  failedReviews: number;
  totalFindingsDetected: number;
  totalStrengthsIdentified: number;
  averageReviewDurationMs: number;
  peakReviewDurationMs: number;
};

export type AccessibilityLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AccessibilityIntelligenceState = {
  engineVersion: AccessibilityIntelligenceEngineVersion;
  missionId: "T2-06";
  status: ReviewStatus;
  initializedAt: string;
  configuration: AccessibilityIntelligenceConfiguration;
  latestRecord: AccessibilityReviewRecord | null;
  latestReport: AccessibilityReviewReport | null;
  health: AccessibilityHealthReport;
  performance: AccessibilityPerformanceStats;
};

export type AccessibilityIntelligenceCockpitSnapshot = {
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
