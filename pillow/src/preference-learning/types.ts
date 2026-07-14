/** PILLOW-PL-001 — Preference Learning types (T4-08). */

import type {
  ENGINE_STATUSES,
  LEARNING_SCOPES,
  PREFERENCE_CATEGORIES,
  PREFERENCE_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";

export type PreferenceLearningEngineVersion = "PILLOW-PL-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type PreferenceStatus = (typeof PREFERENCE_STATUSES)[number];
export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];
export type LearningScope = (typeof LEARNING_SCOPES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type ExplicitEvidenceReference = {
  evidenceId: string;
  evidenceType: string;
  sourceId: string | null;
  summary: string;
  strength: "explicit" | "inferred";
};

export type CollaborationPreferenceRecord = {
  preferenceId: string;
  timestamp: string;
  preferenceVersion: string;
  preferenceCategory: PreferenceCategory;
  preferenceDescription: string;
  sourceApprovalIds: string[];
  sourceProposalIds: string[];
  sourceExplanationIds: string[];
  sourceConversationIds: string[];
  sourceAnnotationIds: string[];
  learnedBehaviorSummary: string;
  confidenceScore: number;
  explicitEvidenceReferences: ExplicitEvidenceReference[];
  currentStatus: PreferenceStatus;
  metadataVersion: string;
};

export type PreferenceLearningSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  preferences: CollaborationPreferenceRecord[];
  status: PreferenceStatus;
};

export type PreferenceLearningValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  preferencesLearned: number;
  preferencesUpdated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PreferenceLearningRunReport = {
  preferenceLearningRunReportId: string;
  runTimestamp: string;
  session: PreferenceLearningSession;
  preferences: CollaborationPreferenceRecord[];
  validation: PreferenceLearningValidationReport;
  durationMs: number;
  metadataVersion: string;
  preferenceVersion: string;
};

export type PreferenceLearningHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  learningEnabled: boolean;
  learningSessionsCompleted: number;
  lastLearningAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type PreferenceLearningPerformanceStats = {
  totalLearningSessions: number;
  successfulSessions: number;
  failedSessions: number;
  totalPreferencesLearned: number;
  preferencesUpdated: number;
  approvalSignalsProcessed: number;
  conversationSignalsProcessed: number;
  averageLearningDurationMs: number;
  peakLearningDurationMs: number;
};

export type PreferenceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PreferenceLearningState = {
  engineVersion: PreferenceLearningEngineVersion;
  missionId: "T4-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: PreferenceLearningConfiguration;
  latestReport: PreferenceLearningRunReport | null;
  learnedPreferences: CollaborationPreferenceRecord[];
  currentPreferenceVersion: string;
  health: PreferenceLearningHealthReport;
  performance: PreferenceLearningPerformanceStats;
};

export type PreferenceLearningCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: PreferenceLearningHealthReport["status"];
  lastDecision: ValidationDecision | null;
  activeSessions: number;
  totalLearningSessions: number;
  preferencesLearned: number;
  preferenceVersion: string;
  confidenceScore: number;
  recentLogs: string[];
};

/** Input for a preference learning run. */
export type PreferenceLearningInput = {
  sessionId?: string;
  learningScope?: LearningScope;
  categories?: PreferenceCategory[];
};
