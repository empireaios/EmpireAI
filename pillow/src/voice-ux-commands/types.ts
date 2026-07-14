/** PILLOW-VUC-001 — Voice UX Commands types (T4-02). */

import type {
  ENGINE_STATUSES,
  PROCESSING_STATUSES,
  SPEECH_TO_TEXT_PROVIDERS,
  VOICE_COMMAND_TYPES,
  VOICE_DECISIONS,
} from "./paths.js";
import type { VoiceUxCommandsConfiguration } from "./configuration.js";

export type VoiceUxCommandsEngineVersion = "PILLOW-VUC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];
export type VoiceCommandType = (typeof VOICE_COMMAND_TYPES)[number];
export type VoiceDecision = (typeof VOICE_DECISIONS)[number];
export type SpeechToTextProvider = (typeof SPEECH_TO_TEXT_PROVIDERS)[number];

export type VoiceClarificationQuestion = {
  questionId: string;
  question: string;
  reason: string;
};

export type VoiceUxCommandRecord = {
  voiceCommandId: string;
  timestamp: string;
  sessionId: string;
  sourceAudioReference: string | null;
  transcribedText: string;
  transcriptionConfidence: number;
  intentId: string | null;
  currentScreenId: string | null;
  currentRouteOrViewId: string | null;
  referencedComponentIds: string[];
  referencedLayoutRegionIds: string[];
  referencedNavigationNodes: string[];
  voiceCommandType: VoiceCommandType;
  userRequestSummary: string;
  uxConcernSummary: string;
  designPreferenceSummary: string | null;
  clarificationRequirement: string | null;
  clarificationQuestions: VoiceClarificationQuestion[];
  linkedConversationRunId: string | null;
  linkedUxFindingIds: string[];
  linkedBuilderCapabilities: string[];
  processingStatus: ProcessingStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type VoiceCommandSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  commands: VoiceUxCommandRecord[];
  status: ProcessingStatus;
};

export type VoiceCommandRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: VoiceDecision;
  commandsProcessed: number;
  clarificationsRequested: number;
  conversationLinksCreated: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type VoiceCommandRunReport = {
  voiceCommandRunReportId: string;
  runTimestamp: string;
  session: VoiceCommandSession;
  latestCommand: VoiceUxCommandRecord | null;
  validation: VoiceCommandRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type VoiceCommandHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  voiceCommandsEnabled: boolean;
  commandsCompleted: number;
  lastCommandAt: string | null;
  lastCommandDecision: VoiceDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type VoiceCommandPerformanceStats = {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  totalTranscriptions: number;
  clarificationsRequested: number;
  conversationLinksCreated: number;
  averageCommandDurationMs: number;
  peakCommandDurationMs: number;
};

export type VoiceCommandLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type VoiceUxCommandsState = {
  engineVersion: VoiceUxCommandsEngineVersion;
  missionId: "T4-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: VoiceUxCommandsConfiguration;
  latestReport: VoiceCommandRunReport | null;
  health: VoiceCommandHealthReport;
  performance: VoiceCommandPerformanceStats;
};

export type VoiceUxCommandsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: VoiceCommandHealthReport["status"];
  lastDecision: VoiceDecision | null;
  activeSessions: number;
  totalCommands: number;
  clarificationsPending: number;
  conversationLinks: number;
  confidenceScore: number;
  totalTranscriptions: number;
  recentLogs: string[];
};

/** Input for a voice command turn — audio ref and/or pre-transcribed text. */
export type VoiceCommandInput = {
  sessionId?: string;
  /** Opaque audio reference only — never raw audio bytes. */
  sourceAudioReference?: string | null;
  /** Optional pre-transcribed text (passthrough / browser STT). */
  transcribedText?: string | null;
  /** Optional simulated transcript for local adapter testing. */
  simulatedTranscript?: string | null;
};
