/** PILLOW-ESL-001 — Executive Style Learning types (T2-03). */

import type {
  LEARNING_STATUSES,
  PREFERENCE_CATEGORIES,
  PREFERENCE_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";

export type ExecutiveStyleLearningEngineVersion = "PILLOW-ESL-001";
export type LearningStatus = (typeof LEARNING_STATUSES)[number];
export type PreferenceStatus = (typeof PREFERENCE_STATUSES)[number];
export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type PreferenceRecord = {
  preferenceId: string;
  preferenceCategory: PreferenceCategory;
  preferenceDescription: string;
  preferenceValue: string;
  sourceReference: string;
  learningConfidence: number;
  firstObservedTimestamp: string;
  lastUpdatedTimestamp: string;
  currentStatus: PreferenceStatus;
  version: string;
  metadataVersion: string;
};

export type ExecutiveStyleModel = {
  executiveStyleId: string;
  preferenceModelVersion: string;
  learningTimestamp: string;
  preferredLayoutStyles: string[];
  preferredComponentStyles: string[];
  preferredTypography: string[];
  preferredColorPreferences: string[];
  preferredSpacingPreferences: string[];
  preferredSizingPreferences: string[];
  preferredNavigationStyles: string[];
  preferredDashboardOrganization: string[];
  preferredInteractionStyles: string[];
  preferredVisualDensity: string;
  preferredConsistencyRules: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type PreferenceLearningEvent = {
  eventId: string;
  eventType: "approval" | "rejection";
  category: PreferenceCategory;
  description: string;
  value: string;
  referenceId: string;
  timestamp: string;
};

export type PreferenceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  preferencesValidated: number;
  conflictsResolved: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExecutiveStyleLearningReport = {
  learningReportId: string;
  learningTimestamp: string;
  model: ExecutiveStyleModel;
  preferences: PreferenceRecord[];
  validation: PreferenceValidationReport;
  approvalsProcessed: number;
  rejectionsProcessed: number;
  preferencesUpdated: number;
  durationMs: number;
  metadataVersion: string;
};

export type LearningHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  learningEnabled: boolean;
  preferencesLearned: number;
  lastLearningAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type LearningPerformanceStats = {
  totalLearningRuns: number;
  successfulLearningRuns: number;
  failedLearningRuns: number;
  totalApprovals: number;
  totalRejections: number;
  totalPreferencesLearned: number;
  averageLearningDurationMs: number;
  peakLearningDurationMs: number;
};

export type LearningLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ExecutiveStyleLearningState = {
  engineVersion: ExecutiveStyleLearningEngineVersion;
  missionId: "T2-03";
  status: LearningStatus;
  initializedAt: string;
  configuration: ExecutiveStyleLearningConfiguration;
  latestModel: ExecutiveStyleModel | null;
  latestReport: ExecutiveStyleLearningReport | null;
  health: LearningHealthReport;
  performance: LearningPerformanceStats;
};

export type ExecutiveStyleLearningCockpitSnapshot = {
  learningStatus: LearningStatus;
  healthStatus: string;
  preferenceModelVersion: string | null;
  preferencesLearned: number;
  confidenceScore: number;
  lastDecision: ValidationDecision | null;
  totalApprovals: number;
  totalRejections: number;
  recentLogs: string[];
};
