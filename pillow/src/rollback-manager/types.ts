/** PILLOW-RM-001 — Rollback Manager types (T3-08). */

import type {
  ENGINE_STATUSES,
  RESTORE_POINT_STATUSES,
  ROLLBACK_DECISIONS,
  ROLLBACK_SCOPES,
  ROLLBACK_STATUSES,
  ROLLBACK_TRIGGERS,
} from "./paths.js";
import type { RollbackManagerConfiguration } from "./configuration.js";

export type RollbackManagerEngineVersion = "PILLOW-RM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type RollbackDecision = (typeof ROLLBACK_DECISIONS)[number];
export type RollbackStatus = (typeof ROLLBACK_STATUSES)[number];
export type RestorePointStatus = (typeof RESTORE_POINT_STATUSES)[number];
export type RollbackTrigger = (typeof ROLLBACK_TRIGGERS)[number];
export type RollbackScope = (typeof ROLLBACK_SCOPES)[number];

export type RestorePoint = {
  restorePointId: string;
  timestamp: string;
  sourceUiStateId: string | null;
  sourceFrontendBuildId: string | null;
  sourceComponentGenerationIds: string[];
  sourceLayoutRefactoringIds: string[];
  sourceThemeIds: string[];
  fileSnapshotReferences: string[];
  componentVersionReferences: string[];
  layoutVersionReferences: string[];
  themeVersionReferences: string[];
  restorePointStatus: RestorePointStatus;
  metadataVersion: string;
};

export type RollbackVerificationResult = {
  verified: boolean;
  checksPassed: number;
  checksFailed: number;
  details: string[];
};

export type RollbackReport = {
  rollbackReportId: string;
  timestamp: string;
  rollbackTrigger: RollbackTrigger;
  sourceRegressionReportId: string | null;
  sourceValidationReportId: string | null;
  sourcePreviewBuildId: string | null;
  sourceFrontendBuildRecordId: string | null;
  restorePointId: string;
  previousKnownGoodStateId: string;
  revertedFiles: string[];
  revertedComponents: string[];
  revertedLayouts: string[];
  revertedThemes: string[];
  rollbackStatus: RollbackStatus;
  rollbackVerificationResult: RollbackVerificationResult;
  errorList: string[];
  warningList: string[];
  evidenceReferences: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type RollbackRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: RollbackDecision;
  rollbacksExecuted: number;
  restorePointsCreated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RollbackRunReport = {
  rollbackRunReportId: string;
  runTimestamp: string;
  reports: RollbackReport[];
  restorePoints: RestorePoint[];
  validation: RollbackRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RollbackManagerHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  rollbackEnabled: boolean;
  rollbacksCompleted: number;
  restorePointsActive: number;
  lastRollbackAt: string | null;
  lastRollbackDecision: RollbackDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type RollbackManagerPerformanceStats = {
  totalRollbacks: number;
  successfulRollbacks: number;
  failedRollbacks: number;
  restorePointsCreated: number;
  verifiedRollbacks: number;
  averageRollbackDurationMs: number;
  peakRollbackDurationMs: number;
};

export type RollbackManagerLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RollbackManagerState = {
  engineVersion: RollbackManagerEngineVersion;
  missionId: "T3-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: RollbackManagerConfiguration;
  latestReport: RollbackRunReport | null;
  health: RollbackManagerHealthReport;
  performance: RollbackManagerPerformanceStats;
};

export type RollbackManagerCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: RollbackManagerHealthReport["status"];
  lastDecision: RollbackDecision | null;
  rollbacksCount: number;
  restorePointsCount: number;
  verifiedCount: number;
  confidenceScore: number;
  totalRollbacks: number;
  recentLogs: string[];
};
