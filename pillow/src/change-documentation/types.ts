/** PILLOW-CD-001 — Change Documentation types (T3-09). */

import type {
  CHANGE_STATUSES,
  CHANGE_TYPES,
  DOCUMENTATION_DECISIONS,
  DOCUMENTATION_SCOPES,
  ENGINE_STATUSES,
} from "./paths.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";

export type ChangeDocumentationEngineVersion = "PILLOW-CD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type DocumentationDecision = (typeof DOCUMENTATION_DECISIONS)[number];
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];
export type ChangeType = (typeof CHANGE_TYPES)[number];
export type DocumentationScope = (typeof DOCUMENTATION_SCOPES)[number];

export type ChangeDocumentationRecord = {
  changeDocumentationId: string;
  timestamp: string;
  changeType: ChangeType;
  sourceFrontendBuildRecordIds: string[];
  sourceComponentGenerationIds: string[];
  sourceLayoutRefactoringIds: string[];
  sourceThemeIds: string[];
  sourcePreviewBuildId: string | null;
  sourceValidationReportId: string | null;
  sourceRegressionReportId: string | null;
  sourceRollbackReportId: string | null;
  affectedScreenIds: string[];
  affectedRouteOrViewIds: string[];
  affectedComponentIds: string[];
  affectedLayoutRegionIds: string[];
  affectedFiles: string[];
  changeSummary: string;
  confidenceScore?: number;
  uxRationale: string;
  safetySummary: string;
  validationSummary: string;
  regressionSummary: string;
  rollbackSummary: string | null;
  finalChangeStatus: ChangeStatus;
  evidenceReferences: string[];
  metadataVersion: string;
};

export type ChangeDocumentationRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: DocumentationDecision;
  recordsDocumented: number;
  scopesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ChangeDocumentationRunReport = {
  changeDocumentationRunReportId: string;
  runTimestamp: string;
  records: ChangeDocumentationRecord[];
  validation: ChangeDocumentationRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ChangeDocumentationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  documentationEnabled: boolean;
  documentationsCompleted: number;
  lastDocumentationAt: string | null;
  lastDocumentationDecision: DocumentationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  recordsDocumentedTotal: number;
  notes: string[];
};

export type ChangeDocumentationPerformanceStats = {
  totalDocumentations: number;
  successfulDocumentations: number;
  failedDocumentations: number;
  totalRecordsDocumented: number;
  averageRecordsPerRun: number;
  averageDocumentationDurationMs: number;
  peakDocumentationDurationMs: number;
};

export type ChangeDocumentationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ChangeDocumentationState = {
  engineVersion: ChangeDocumentationEngineVersion;
  missionId: "T3-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ChangeDocumentationConfiguration;
  latestReport: ChangeDocumentationRunReport | null;
  health: ChangeDocumentationHealthReport;
  performance: ChangeDocumentationPerformanceStats;
};

export type ChangeDocumentationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ChangeDocumentationHealthReport["status"];
  lastDecision: DocumentationDecision | null;
  recordsCount: number;
  acceptedCount: number;
  rejectedCount: number;
  confidenceScore: number;
  totalDocumentations: number;
  recentLogs: string[];
};
