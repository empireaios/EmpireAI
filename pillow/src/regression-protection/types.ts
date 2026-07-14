/** PILLOW-RP-001 — Regression Protection types (T3-07). */

import type {
  BASELINE_SOURCE_RULES,
  COMPARISON_SCOPES,
  ENGINE_STATUSES,
  PROTECTION_DECISIONS,
  REGRESSION_CATEGORIES,
  REGRESSION_SEVERITIES,
  REGRESSION_STATUSES,
} from "./paths.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";

export type RegressionProtectionEngineVersion = "PILLOW-RP-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ProtectionDecision = (typeof PROTECTION_DECISIONS)[number];
export type RegressionStatus = (typeof REGRESSION_STATUSES)[number];
export type ComparisonScope = (typeof COMPARISON_SCOPES)[number];
export type RegressionCategory = (typeof REGRESSION_CATEGORIES)[number];
export type RegressionSeverity = (typeof REGRESSION_SEVERITIES)[number];
export type BaselineSourceRule = (typeof BASELINE_SOURCE_RULES)[number];

export type UiRegression = {
  regressionId: string;
  regressionCategory: RegressionCategory;
  regressionDescription: string;
  severity: RegressionSeverity;
  baselineReference: string;
  proposedReference: string;
  affectedScreenId: string | null;
  affectedRouteOrViewId: string | null;
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  evidenceMetadata: Record<string, string>;
  detectionConfidence: number;
  timestamp: string;
  metadataVersion: string;
};

export type BaselineUiState = {
  baselineUiStateId: string;
  timestamp: string;
  sourceValidationReportId: string | null;
  sourceUxScoreId: string | null;
  sourcePreviewBuildId: string | null;
  sourceFrontendBuildRecordIds: string[];
  overallUxScore: number;
  layoutScore: number;
  componentScore: number;
  navigationScore: number;
  accessibilityScore: number;
  consistencyScore: number;
  workflowScore: number;
  responsiveScore: number;
  executivePreferenceScore: number;
  screenIds: string[];
  componentIds: string[];
  metadataVersion: string;
};

export type ProposedUiState = {
  proposedUiStateId: string;
  timestamp: string;
  sourceValidationReportId: string | null;
  sourcePreviewBuildId: string | null;
  sourceFrontendBuildRecordIds: string[];
  sourceUxScoreId: string | null;
  sourceRecommendationId: string | null;
  overallUxScore: number;
  layoutScore: number;
  componentScore: number;
  navigationScore: number;
  accessibilityScore: number;
  consistencyScore: number;
  workflowScore: number;
  responsiveScore: number;
  executivePreferenceScore: number;
  screenIds: string[];
  componentIds: string[];
  metadataVersion: string;
};

export type RegressionProtectionReport = {
  regressionReportId: string;
  timestamp: string;
  sourceValidationReportId: string;
  sourcePreviewBuildId: string | null;
  sourceFrontendBuildRecordIds: string[];
  sourceUxScoreId: string | null;
  sourceRecommendationId: string | null;
  baselineUiStateId: string;
  proposedUiStateId: string;
  regressionStatus: RegressionStatus;
  detectedRegressions: UiRegression[];
  protectedScreens: string[];
  protectedComponents: string[];
  protectedLayouts: string[];
  protectedNavigationNodes: string[];
  evidenceReferences: string[];
  severity: RegressionSeverity;
  confidenceScore: number;
  finalProtectionDecision: ProtectionDecision;
  metadataVersion: string;
};

export type RegressionRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ProtectionDecision;
  reportsChecked: number;
  regressionsDetected: number;
  scopesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RegressionRunReport = {
  regressionRunReportId: string;
  runTimestamp: string;
  reports: RegressionProtectionReport[];
  validation: RegressionRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RegressionProtectionHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  protectionEnabled: boolean;
  checksCompleted: number;
  lastCheckAt: string | null;
  lastProtectionDecision: ProtectionDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  regressionsDetectedTotal: number;
  notes: string[];
};

export type RegressionProtectionPerformanceStats = {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  totalRegressionsDetected: number;
  blockedChanges: number;
  averageRegressionsPerCheck: number;
  averageCheckDurationMs: number;
  peakCheckDurationMs: number;
};

export type RegressionProtectionLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RegressionProtectionState = {
  engineVersion: RegressionProtectionEngineVersion;
  missionId: "T3-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: RegressionProtectionConfiguration;
  latestReport: RegressionRunReport | null;
  health: RegressionProtectionHealthReport;
  performance: RegressionProtectionPerformanceStats;
};

export type RegressionProtectionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: RegressionProtectionHealthReport["status"];
  lastDecision: ProtectionDecision | null;
  reportsCount: number;
  regressionsCount: number;
  blockedCount: number;
  confidenceScore: number;
  totalChecks: number;
  recentLogs: string[];
};
