/** PILLOW-UXS-001 — UX Scoring Engine types (T2-08). */

import type {
  SCORING_CATEGORIES,
  SCORING_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { UxScoringConfiguration } from "./configuration.js";

export type UxScoringEngineVersion = "PILLOW-UXS-001";
export type ScoringStatus = (typeof SCORING_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type ScoringCategory = (typeof SCORING_CATEGORIES)[number];

export type ScoreBreakdownEntry = {
  category: ScoringCategory;
  score: number;
  weight: number;
  weightedScore: number;
  findingsCount: number;
  strengthsCount: number;
  evidenceRef: string | null;
};

export type UxScoreRecord = {
  uxScoreId: string;
  timestamp: string;
  screenId: string | null;
  routeOrViewId: string | null;
  sourceUxRuleResultIds: string[];
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  sourceLayoutEvaluationId: string | null;
  sourceWorkflowOptimizationId: string | null;
  sourceAccessibilityReviewId: string | null;
  sourceConsistencyReviewId: string | null;
  overallUxScore: number;
  screenScore: number;
  componentScore: number;
  layoutScore: number;
  workflowScore: number;
  accessibilityScore: number;
  consistencyScore: number;
  executivePreferenceAlignmentScore: number;
  scoreBreakdown: ScoreBreakdownEntry[];
  scoreEvidenceReferences: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type UxScoringValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  scoresValidated: number;
  categoriesScored: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type UxScoringReport = {
  scoringReportId: string;
  scoringTimestamp: string;
  record: UxScoreRecord;
  validation: UxScoringValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type UxScoringHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  scoringEnabled: boolean;
  scoresCompleted: number;
  lastScoringAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type UxScoringPerformanceStats = {
  totalScorings: number;
  successfulScorings: number;
  failedScorings: number;
  averageOverallScore: number;
  averageScoringDurationMs: number;
  peakScoringDurationMs: number;
};

export type UxScoringLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type UxScoringState = {
  engineVersion: UxScoringEngineVersion;
  missionId: "T2-08";
  status: ScoringStatus;
  initializedAt: string;
  configuration: UxScoringConfiguration;
  latestRecord: UxScoreRecord | null;
  latestReport: UxScoringReport | null;
  health: UxScoringHealthReport;
  performance: UxScoringPerformanceStats;
};

export type UxScoringCockpitSnapshot = {
  scoringStatus: ScoringStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  overallUxScore: number;
  passThreshold: number;
  categoriesScored: number;
  confidenceScore: number;
  totalScorings: number;
  recentLogs: string[];
};
