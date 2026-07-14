/** PILLOW-CC-001 — Continuous Collaboration types (T4-09). */

import type {
  ENGINE_STATUSES,
  SESSION_STATUSES,
  DISCUSSION_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import type { CollaborationPreferenceRecord } from "../preference-learning/types.js";

export type ContinuousCollaborationEngineVersion = "PILLOW-CC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type DiscussionStatus = (typeof DISCUSSION_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type AppliedCollaborationPreference = {
  preferenceId: string;
  preferenceCategory: string;
  appliedSummary: string;
  confidenceScore: number;
  explicitOverrideAllowed: boolean;
};

export type ActiveDiscussionTopic = {
  topicId: string;
  topic: string;
  sourceType: "conversation" | "annotation" | "voice" | "proposal" | "review";
  sourceId: string | null;
  status: DiscussionStatus;
  lastUpdatedAt: string;
};

export type CollaborationSessionRecord = {
  collaborationSessionId: string;
  timestamp: string;
  sessionStatus: SessionStatus;
  activeDiscussionTopics: ActiveDiscussionTopic[];
  pendingProposalIds: string[];
  pendingComparisonIds: string[];
  pendingApprovalIds: string[];
  activeUxGoals: string[];
  activeDesignDirection: string | null;
  collaborationContextSummary: string;
  appliedCollaborationPreferences: AppliedCollaborationPreference[];
  outstandingClarificationItems: string[];
  confidenceScore: number;
  metadataVersion: string;
};

export type CollaborationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  sessionsSynchronized: number;
  discussionsTracked: number;
  proposalsTracked: number;
  approvalsTracked: number;
  preferencesApplied: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ContinuousCollaborationRunReport = {
  collaborationRunReportId: string;
  runTimestamp: string;
  session: CollaborationSessionRecord;
  validation: CollaborationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ContinuousCollaborationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  collaborationEnabled: boolean;
  sessionsSynchronized: number;
  lastSynchronizationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ContinuousCollaborationPerformanceStats = {
  totalSynchronizations: number;
  successfulSynchronizations: number;
  failedSynchronizations: number;
  sessionsRestored: number;
  discussionsUpdated: number;
  proposalsTracked: number;
  approvalsTracked: number;
  preferencesApplied: number;
  averageSynchronizationDurationMs: number;
  peakSynchronizationDurationMs: number;
};

export type CollaborationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ContinuousCollaborationState = {
  engineVersion: ContinuousCollaborationEngineVersion;
  missionId: "T4-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ContinuousCollaborationConfiguration;
  latestReport: ContinuousCollaborationRunReport | null;
  activeSession: CollaborationSessionRecord | null;
  health: ContinuousCollaborationHealthReport;
  performance: ContinuousCollaborationPerformanceStats;
};

export type ContinuousCollaborationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ContinuousCollaborationHealthReport["status"];
  lastDecision: ValidationDecision | null;
  activeSessions: number;
  totalSynchronizations: number;
  activeDiscussions: number;
  pendingProposals: number;
  pendingApprovals: number;
  confidenceScore: number;
  recentLogs: string[];
};

export type ContinuousCollaborationInput = {
  sessionId?: string;
  restoreContext?: boolean;
  applyPreferences?: boolean;
};

export type ContinuousCollaborationEngineBundle = {
  naturalUxConversation: import("../natural-ux-conversation/engine.js").NaturalUxConversationEngine | null;
  voiceUxCommands: import("../voice-ux-commands/engine.js").VoiceUxCommandsEngine | null;
  screenAnnotation: import("../screen-annotation/engine.js").ScreenAnnotationEngine | null;
  multiProposalGenerator: import("../multi-proposal-generator/engine.js").MultiProposalGeneratorEngine | null;
  sideBySideComparison: import("../side-by-side-comparison/engine.js").SideBySideComparisonEngine | null;
  explainDecisions: import("../explain-decisions/engine.js").ExplainDecisionsEngine | null;
  approvalWorkflow: import("../approval-workflow/engine.js").ApprovalWorkflowEngine | null;
  preferenceLearning: import("../preference-learning/engine.js").PreferenceLearningEngine | null;
};

export type { CollaborationPreferenceRecord };
