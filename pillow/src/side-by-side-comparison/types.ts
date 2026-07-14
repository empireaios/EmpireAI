/** PILLOW-SBC-001 — Side-by-Side Comparison types (T4-05). */

import type {
  COMPARISON_DECISIONS,
  COMPARISON_STATUSES,
  COMPARISON_TYPES,
  ENGINE_STATUSES,
} from "./paths.js";
import type { SideBySideComparisonConfiguration } from "./configuration.js";

export type SideBySideComparisonEngineVersion = "PILLOW-SBC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ComparisonStatus = (typeof COMPARISON_STATUSES)[number];
export type ComparisonType = (typeof COMPARISON_TYPES)[number];
export type ComparisonDecision = (typeof COMPARISON_DECISIONS)[number];

export type ComparedOption = {
  optionId: string;
  label: string;
  proposalId: string | null;
  previewBuildId: string | null;
  proposalCategory: string;
  layoutReference: string | null;
};

export type VisualDifferenceMarker = {
  markerId: string;
  region: string;
  differenceType: string;
  description: string;
  severity: "low" | "medium" | "high";
};

export type ScoreDifferenceSummary = {
  metric: string;
  baselineValue: number | null;
  comparedValue: number | null;
  delta: number | null;
};

export type SideBySideComparisonRecord = {
  comparisonId: string;
  timestamp: string;
  sessionId: string;
  comparisonType: ComparisonType;
  sourceProposalIds: string[];
  sourcePreviewBuildIds: string[];
  sourceUxScoreIds: string[];
  sourceValidationReportIds: string[];
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  comparedOptions: ComparedOption[];
  originalLayoutReference: string | null;
  proposedLayoutReferences: string[];
  differenceSummary: string;
  visualDifferenceMarkers: VisualDifferenceMarker[];
  uxScoreDifferences: ScoreDifferenceSummary[];
  accessibilityDifferences: ScoreDifferenceSummary[];
  consistencyDifferences: ScoreDifferenceSummary[];
  workflowDifferences: ScoreDifferenceSummary[];
  comparisonStatus: ComparisonStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type ComparisonSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  comparisons: SideBySideComparisonRecord[];
  status: ComparisonStatus;
};

export type ComparisonRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ComparisonDecision;
  comparisonsProcessed: number;
  optionsCompared: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ComparisonRunReport = {
  comparisonRunReportId: string;
  runTimestamp: string;
  session: ComparisonSession;
  comparison: SideBySideComparisonRecord;
  validation: ComparisonRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ComparisonHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  comparisonEnabled: boolean;
  comparisonsCompleted: number;
  lastComparisonAt: string | null;
  lastComparisonDecision: ComparisonDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ComparisonPerformanceStats = {
  totalComparisons: number;
  successfulComparisons: number;
  failedComparisons: number;
  totalOptionsCompared: number;
  previewsLinked: number;
  uxScoresCompared: number;
  averageComparisonDurationMs: number;
  peakComparisonDurationMs: number;
};

export type ComparisonLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SideBySideComparisonState = {
  engineVersion: SideBySideComparisonEngineVersion;
  missionId: "T4-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SideBySideComparisonConfiguration;
  latestReport: ComparisonRunReport | null;
  health: ComparisonHealthReport;
  performance: ComparisonPerformanceStats;
};

export type SideBySideComparisonCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ComparisonHealthReport["status"];
  lastDecision: ComparisonDecision | null;
  activeSessions: number;
  totalComparisons: number;
  optionsCompared: number;
  differenceMarkers: number;
  confidenceScore: number;
  recentLogs: string[];
};

/** Input for a side-by-side comparison run. */
export type ComparisonInput = {
  sessionId?: string;
  comparisonType: ComparisonType;
  /** Explicit proposal IDs; defaults to latest T4-04 run when omitted. */
  proposalIds?: string[];
  /** Include original/baseline layout as first column. */
  includeOriginal?: boolean;
  baselineProposalId?: string | null;
};
