/** PILLOW-LR-001 — Layout Refactoring types (T3-03). */

import type {
  ENGINE_STATUSES,
  LAYOUT_SCOPES,
  REFACTORING_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";

export type LayoutRefactoringEngineVersion = "PILLOW-LR-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type RefactoringStatus = (typeof REFACTORING_STATUSES)[number];
export type LayoutScope = (typeof LAYOUT_SCOPES)[number];

export type SafetyCheck = {
  checkId: string;
  checkName: string;
  passed: boolean;
  details: string;
};

export type ComponentPlacement = {
  placementId: string;
  componentName: string;
  region: string;
  order: number;
  responsiveBehavior: string;
};

export type LayoutRefactoringRecord = {
  layoutRefactoringId: string;
  timestamp: string;
  sourceRecommendationId: string;
  sourceUxScoreId: string | null;
  sourceLayoutEvaluationId: string | null;
  sourceWorkflowOptimizationId: string | null;
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  sourceFrontendBuildRecordId: string | null;
  sourceComponentGenerationIds: string[];
  targetScreenId: string;
  targetRouteOrViewId: string | null;
  targetFiles: string[];
  currentLayoutSummary: string;
  proposedLayoutStructure: string[];
  refactoredLayoutCode: string;
  componentPlacementMap: ComponentPlacement[];
  responsiveBehaviorSummary: string[];
  safetyChecks: SafetyCheck[];
  refactoringStatus: RefactoringStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type LayoutRefactoringValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  recordsValidated: number;
  scopesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LayoutRefactoringReport = {
  layoutRefactoringReportId: string;
  refactoringTimestamp: string;
  records: LayoutRefactoringRecord[];
  validation: LayoutRefactoringValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LayoutRefactoringHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  refactoringEnabled: boolean;
  refactoringsCompleted: number;
  lastRefactoringAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type LayoutRefactoringPerformanceStats = {
  totalRefactorings: number;
  successfulRefactorings: number;
  failedRefactorings: number;
  totalLayoutsRefactored: number;
  averageLayoutsPerRefactoring: number;
  averageRefactoringDurationMs: number;
  peakRefactoringDurationMs: number;
};

export type LayoutRefactoringLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LayoutRefactoringState = {
  engineVersion: LayoutRefactoringEngineVersion;
  missionId: "T3-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: LayoutRefactoringConfiguration;
  latestReport: LayoutRefactoringReport | null;
  health: LayoutRefactoringHealthReport;
  performance: LayoutRefactoringPerformanceStats;
};

export type LayoutRefactoringCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: LayoutRefactoringHealthReport["status"];
  lastDecision: ValidationDecision | null;
  layoutsCount: number;
  validatedCount: number;
  blockedCount: number;
  confidenceScore: number;
  totalRefactorings: number;
  recentLogs: string[];
};
