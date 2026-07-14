/** PILLOW-FB-001 — Frontend Builder types (T3-01). */

import type {
  BUILD_PRIORITIES,
  BUILD_STATUSES,
  CHANGE_TYPES,
  CODE_GENERATION_SCOPES,
  ENGINE_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";

export type FrontendBuilderEngineVersion = "PILLOW-FB-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type BuildStatus = (typeof BUILD_STATUSES)[number];
export type BuildPriority = (typeof BUILD_PRIORITIES)[number];
export type CodeGenerationScope = (typeof CODE_GENERATION_SCOPES)[number];
export type ChangeType = (typeof CHANGE_TYPES)[number];

export type SafetyCheck = {
  checkId: string;
  checkName: string;
  passed: boolean;
  details: string;
};

export type ProposedCodeChange = {
  changeId: string;
  targetFile: string;
  changeType: ChangeType;
  scope: CodeGenerationScope;
  description: string;
  suggestedSnippet: string;
  preservesArchitecture: boolean;
};

export type ImplementationPlan = {
  planId: string;
  steps: string[];
  estimatedFilesAffected: number;
  avoidsDestructiveChanges: boolean;
};

export type FrontendBuildRecord = {
  buildRecordId: string;
  timestamp: string;
  sourceRecommendationId: string;
  sourceUxScoreId: string | null;
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  targetFiles: string[];
  proposedCodeChanges: ProposedCodeChange[];
  implementationPlan: ImplementationPlan;
  designSystemConstraints: string[];
  executivePreferenceConstraints: string[];
  safetyChecks: SafetyCheck[];
  buildStatus: BuildStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type FrontendBuildValidationReport = {
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

export type FrontendBuildReport = {
  frontendBuildReportId: string;
  buildTimestamp: string;
  records: FrontendBuildRecord[];
  validation: FrontendBuildValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FrontendBuildHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  builderEnabled: boolean;
  buildsCompleted: number;
  lastBuildAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type FrontendBuildPerformanceStats = {
  totalBuilds: number;
  successfulBuilds: number;
  failedBuilds: number;
  totalRecordsGenerated: number;
  averageRecordsPerBuild: number;
  averageBuildDurationMs: number;
  peakBuildDurationMs: number;
};

export type FrontendBuildLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FrontendBuilderState = {
  engineVersion: FrontendBuilderEngineVersion;
  missionId: "T3-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: FrontendBuilderConfiguration;
  latestReport: FrontendBuildReport | null;
  health: FrontendBuildHealthReport;
  performance: FrontendBuildPerformanceStats;
};

export type FrontendBuilderCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  recordsCount: number;
  validatedCount: number;
  blockedCount: number;
  confidenceScore: number;
  totalBuilds: number;
  recentLogs: string[];
};
