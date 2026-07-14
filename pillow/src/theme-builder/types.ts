/** PILLOW-TB-001 — Theme Builder types (T3-04). */

import type {
  ENGINE_STATUSES,
  THEME_SCOPES,
  THEME_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";

export type ThemeBuilderEngineVersion = "PILLOW-TB-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type ThemeStatus = (typeof THEME_STATUSES)[number];
export type ThemeScope = (typeof THEME_SCOPES)[number];

export type ThemeToken = {
  tokenId: string;
  tokenName: string;
  tokenValue: string;
  category: string;
};

export type SafetyCheck = {
  checkId: string;
  checkName: string;
  passed: boolean;
  details: string;
};

export type ThemeRecord = {
  themeId: string;
  themeName: string;
  timestamp: string;
  sourceRecommendationId: string | null;
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  sourceFrontendBuildRecordId: string | null;
  sourceComponentGenerationIds: string[];
  sourceLayoutRefactoringId: string | null;
  themeScope: ThemeScope;
  themeTokens: ThemeToken[];
  colorTokens: ThemeToken[];
  typographyTokens: ThemeToken[];
  spacingTokens: ThemeToken[];
  sizingTokens: ThemeToken[];
  borderTokens: ThemeToken[];
  radiusTokens: ThemeToken[];
  shadowTokens: ThemeToken[];
  interactionStateTokens: ThemeToken[];
  componentVariantTokens: ThemeToken[];
  generatedThemeCode: string;
  targetFiles: string[];
  safetyChecks: SafetyCheck[];
  themeStatus: ThemeStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type ThemeGenerationValidationReport = {
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

export type ThemeGenerationReport = {
  themeGenerationReportId: string;
  generationTimestamp: string;
  records: ThemeRecord[];
  validation: ThemeGenerationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ThemeBuilderHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  builderEnabled: boolean;
  generationsCompleted: number;
  lastGenerationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ThemeBuilderPerformanceStats = {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalThemesGenerated: number;
  averageThemesPerGeneration: number;
  averageGenerationDurationMs: number;
  peakGenerationDurationMs: number;
};

export type ThemeBuilderLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ThemeBuilderState = {
  engineVersion: ThemeBuilderEngineVersion;
  missionId: "T3-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: ThemeBuilderConfiguration;
  latestReport: ThemeGenerationReport | null;
  health: ThemeBuilderHealthReport;
  performance: ThemeBuilderPerformanceStats;
};

export type ThemeBuilderCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ThemeBuilderHealthReport["status"];
  lastDecision: ValidationDecision | null;
  themesCount: number;
  validatedCount: number;
  blockedCount: number;
  confidenceScore: number;
  totalGenerations: number;
  recentLogs: string[];
};
