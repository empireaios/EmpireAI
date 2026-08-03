import type { ExperienceReplayEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  EVENT_TYPES,
  EXPERIENCE_SOURCES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OUTCOMES,
  VALIDATION_STATUSES,
  XPL_CAPABILITIES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ExperienceSource = (typeof EXPERIENCE_SOURCES)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type Outcome = (typeof OUTCOMES)[number];
export type ExperienceReplayCapability = (typeof XPL_CAPABILITIES)[number];

/** Input for Q0-14 — historical learning only. */
export type ExperienceReplayEngineInput = {
  replayScope?: string | null;
  missionId?: string | null;
  businessId?: string | null;
  eventTypes?: Array<EventType | string>;
  sources?: Array<ExperienceSource | string>;
  includeGrandKingFeedback?: boolean;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWork?: boolean;
  replaceExecutionMemory?: boolean;
  replaceDecisionEngine?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

/** Historical execution event retrieved for replay (learning source, not Execution Memory). */
export type HistoricalExecutionEvent = {
  historyId: string;
  missionId: string;
  businessId: string;
  eventType: EventType | string;
  source: ExperienceSource | string;
  outcome: Outcome | string;
  summary: string;
  factors: string[];
  grandKingFeedback?: string | null;
  timestamp: string;
};

export type LearnedLesson = {
  lessonId: string;
  statement: string;
  category: "success" | "failure" | "rejection" | "correction" | "pattern";
  confidence: number;
  relatedMissionIds: string[];
};

export type RepeatedMistake = {
  mistakeId: string;
  pattern: string;
  occurrences: number;
  relatedMissionIds: string[];
  severity: "low" | "medium" | "high";
};

/** Machine-readable Experience Record (Q0-14). */
export type ExperienceRecord = {
  experienceId: string;
  timestamp: string;
  missionId: string;
  businessId: string;
  eventType: string;
  outcome: string;
  successFactors: string[];
  failureFactors: string[];
  lessonsLearned: string[];
  recommendedFutureBehaviour: string;
  confidenceScore: number;
  supportingEvidence: string[];
  metadataVersion: string;
  experienceTraceId: string;
  sourcesApplied: string[];
  repeatedMistakes: RepeatedMistake[];
  patternsIdentified: string[];
  validationStatus: ValidationStatus;
  /** Explicit Q0-14 boundaries. */
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionEngine: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workExecuted: false;
  executionMemoryReplaced: false;
  decisionEngineReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveExperienceTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ExperienceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExperienceReplayEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-XPL-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ExperienceReplayCapability[];
  totalExperienceRecords: number;
  lastConfidenceScore: number | null;
  metadataVersion: string;
};

export type ExperienceReplayEngineRunReport = {
  experienceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "replay"
    | "analyse_success"
    | "analyse_failure"
    | "analyse_rejection"
    | "analyse_grand_king"
    | "detect_patterns"
    | "extract_lessons"
    | "recommend"
    | "list_records"
    | "validate_experience"
    | "diagnostics";
  engineRecord: ExperienceReplayEngineRecord;
  records: ExperienceRecord[];
  history: HistoricalExecutionEvent[];
  lessons: LearnedLesson[];
  repeatedMistakes: RepeatedMistake[];
  validation: ExperienceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExperienceReplayEngineState = {
  engineVersion: "PILLOW-XPL-001";
  missionId: "Q0-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: ExperienceReplayEngineConfiguration;
  latestReport: ExperienceReplayEngineRunReport | null;
  engineRecord: ExperienceReplayEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalExperienceRecords: number;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ExperienceReplayEngineCockpitSnapshot = {
  missionId: "Q0-14";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalExperienceRecords: number;
  latestExperienceId: string | null;
  lastConfidenceScore: number | null;
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionEngine: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
