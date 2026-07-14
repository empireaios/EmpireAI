/** PILLOW-PG-001 — Preview Generator types (T3-05). */

import type {
  BUILD_STATUSES,
  ENGINE_STATUSES,
  ENVIRONMENT_STATUSES,
  PREVIEW_SCOPES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { PreviewGeneratorConfiguration } from "./configuration.js";

export type PreviewGeneratorEngineVersion = "PILLOW-PG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type BuildStatus = (typeof BUILD_STATUSES)[number];
export type EnvironmentStatus = (typeof ENVIRONMENT_STATUSES)[number];
export type PreviewScope = (typeof PREVIEW_SCOPES)[number];

export type SafetyCheck = {
  checkId: string;
  checkName: string;
  passed: boolean;
  details: string;
};

export type PreviewBuildRecord = {
  previewBuildId: string;
  timestamp: string;
  sourceFrontendBuildRecordIds: string[];
  sourceComponentGenerationIds: string[];
  sourceLayoutRefactoringIds: string[];
  sourceThemeIds: string[];
  previewScope: PreviewScope;
  previewTargetScreenId: string;
  previewTargetRouteOrViewId: string | null;
  previewFiles: string[];
  previewUrl: string | null;
  previewLocalReference: string | null;
  previewEnvironmentStatus: EnvironmentStatus;
  buildStatus: BuildStatus;
  safetyChecks: SafetyCheck[];
  confidenceScore: number;
  metadataVersion: string;
};

export type PreviewGenerationValidationReport = {
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

export type PreviewGenerationReport = {
  previewGenerationReportId: string;
  generationTimestamp: string;
  records: PreviewBuildRecord[];
  validation: PreviewGenerationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PreviewGeneratorHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  generatorEnabled: boolean;
  previewsCompleted: number;
  lastPreviewAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeEnvironments: number;
  notes: string[];
};

export type PreviewGeneratorPerformanceStats = {
  totalPreviews: number;
  successfulPreviews: number;
  failedPreviews: number;
  totalPreviewBuilds: number;
  averageBuildsPerPreview: number;
  averagePreviewDurationMs: number;
  peakPreviewDurationMs: number;
  cleanupsPerformed: number;
};

export type PreviewGeneratorLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PreviewGeneratorState = {
  engineVersion: PreviewGeneratorEngineVersion;
  missionId: "T3-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: PreviewGeneratorConfiguration;
  latestReport: PreviewGenerationReport | null;
  health: PreviewGeneratorHealthReport;
  performance: PreviewGeneratorPerformanceStats;
};

export type PreviewGeneratorCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: PreviewGeneratorHealthReport["status"];
  lastDecision: ValidationDecision | null;
  previewsCount: number;
  validatedCount: number;
  blockedCount: number;
  activeEnvironments: number;
  confidenceScore: number;
  totalPreviews: number;
  recentLogs: string[];
};
