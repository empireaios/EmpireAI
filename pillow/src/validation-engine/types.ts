/** PILLOW-VE-001 — Validation Engine types (T3-06). */

import type {
  DEFECT_CATEGORIES,
  DEFECT_SEVERITIES,
  ENGINE_STATUSES,
  VALIDATION_DECISIONS,
  VALIDATION_SCOPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ValidationEngineConfiguration } from "./configuration.js";

export type ValidationEngineEngineVersion = "PILLOW-VE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ValidationScope = (typeof VALIDATION_SCOPES)[number];
export type DefectCategory = (typeof DEFECT_CATEGORIES)[number];
export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number];

export type UiDefect = {
  defectId: string;
  defectCategory: DefectCategory;
  defectDescription: string;
  severity: DefectSeverity;
  sourcePreviewBuildId: string;
  affectedScreenId: string | null;
  affectedRouteOrViewId: string | null;
  affectedComponentId: string | null;
  affectedLayoutRegionId: string | null;
  evidenceMetadata: Record<string, string>;
  detectionConfidence: number;
  timestamp: string;
  metadataVersion: string;
};

export type UiValidationReport = {
  validationReportId: string;
  timestamp: string;
  sourcePreviewBuildId: string;
  sourceFrontendBuildRecordIds: string[];
  sourceComponentGenerationIds: string[];
  sourceLayoutRefactoringIds: string[];
  sourceThemeIds: string[];
  validationScope: ValidationScope;
  validationStatus: ValidationStatus;
  detectedDefects: UiDefect[];
  affectedScreens: string[];
  affectedComponents: string[];
  affectedLayouts: string[];
  affectedThemes: string[];
  evidenceReferences: string[];
  severity: DefectSeverity;
  confidenceScore: number;
  metadataVersion: string;
};

export type ValidationRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  reportsValidated: number;
  defectsDetected: number;
  scopesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ValidationRunReport = {
  validationRunReportId: string;
  runTimestamp: string;
  reports: UiValidationReport[];
  validation: ValidationRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ValidationEngineHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  engineEnabled: boolean;
  validationsCompleted: number;
  lastValidationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  defectsDetectedTotal: number;
  notes: string[];
};

export type ValidationEnginePerformanceStats = {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  totalDefectsDetected: number;
  blockedChanges: number;
  averageDefectsPerValidation: number;
  averageValidationDurationMs: number;
  peakValidationDurationMs: number;
};

export type ValidationEngineLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ValidationEngineState = {
  engineVersion: ValidationEngineEngineVersion;
  missionId: "T3-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ValidationEngineConfiguration;
  latestReport: ValidationRunReport | null;
  health: ValidationEngineHealthReport;
  performance: ValidationEnginePerformanceStats;
};

export type ValidationEngineCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ValidationEngineHealthReport["status"];
  lastDecision: ValidationDecision | null;
  reportsCount: number;
  defectsCount: number;
  blockedCount: number;
  confidenceScore: number;
  totalValidations: number;
  recentLogs: string[];
};
