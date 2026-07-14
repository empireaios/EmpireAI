/** PILLOW-NUC-001 — Natural UX Conversation types (T4-01). */

import type {
  CLARIFICATION_STATUSES,
  CONVERSATION_DECISIONS,
  CONVERSATION_STATUSES,
  ENGINE_STATUSES,
  INTENT_CATEGORIES,
} from "./paths.js";
import type { NaturalUxConversationConfiguration } from "./configuration.js";

export type NaturalUxConversationEngineVersion = "PILLOW-NUC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];
export type ClarificationStatus = (typeof CLARIFICATION_STATUSES)[number];
export type IntentCategory = (typeof INTENT_CATEGORIES)[number];
export type ConversationDecision = (typeof CONVERSATION_DECISIONS)[number];

export type ConversationContext = {
  priorTurnCount: number;
  activeTopics: string[];
  lastIntentCategory: IntentCategory | null;
  referencedScreenIds: string[];
  referencedLayoutIds: string[];
  referencedComponentIds: string[];
  referencedWorkflowIds: string[];
  notes: string[];
};

export type UxAction = {
  actionId: string;
  actionType: string;
  description: string;
  targetCategory: IntentCategory;
  priority: "low" | "medium" | "high";
};

export type BuilderRequest = {
  builderRequestId: string;
  requestType: string;
  summary: string;
  targetCapabilities: string[];
  requiresClarification: boolean;
  forwardedToCertifiedBuilder: boolean;
};

export type ClarificationQuestion = {
  questionId: string;
  question: string;
  reason: string;
};

export type ConversationTurn = {
  conversationId: string;
  sessionId: string;
  timestamp: string;
  userRequest: string;
  recognizedIntent: string;
  intentCategory: IntentCategory;
  conversationContext: ConversationContext;
  referencedScreens: string[];
  referencedLayouts: string[];
  referencedComponents: string[];
  referencedWorkflows: string[];
  generatedUxActions: UxAction[];
  generatedBuilderRequests: BuilderRequest[];
  clarificationStatus: ClarificationStatus;
  clarificationQuestions: ClarificationQuestion[];
  conversationStatus: ConversationStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type ConversationSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  turns: ConversationTurn[];
  status: ConversationStatus;
  context: ConversationContext;
};

export type ConversationRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ConversationDecision;
  turnsProcessed: number;
  clarificationsRequested: number;
  builderRequestsGenerated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ConversationRunReport = {
  conversationRunReportId: string;
  runTimestamp: string;
  session: ConversationSession;
  latestTurn: ConversationTurn | null;
  validation: ConversationRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ConversationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  conversationEnabled: boolean;
  conversationsCompleted: number;
  lastConversationAt: string | null;
  lastConversationDecision: ConversationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ConversationPerformanceStats = {
  totalConversations: number;
  successfulConversations: number;
  failedConversations: number;
  totalTurns: number;
  clarificationsRequested: number;
  builderRequestsGenerated: number;
  averageConversationDurationMs: number;
  peakConversationDurationMs: number;
};

export type ConversationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type NaturalUxConversationState = {
  engineVersion: NaturalUxConversationEngineVersion;
  missionId: "T4-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: NaturalUxConversationConfiguration;
  latestReport: ConversationRunReport | null;
  health: ConversationHealthReport;
  performance: ConversationPerformanceStats;
};

export type NaturalUxConversationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ConversationHealthReport["status"];
  lastDecision: ConversationDecision | null;
  activeSessions: number;
  totalTurns: number;
  clarificationsPending: number;
  builderRequestsCount: number;
  confidenceScore: number;
  totalConversations: number;
  recentLogs: string[];
};
