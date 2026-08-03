import type { KnowledgeSharingBusConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  KNOWLEDGE_CATEGORIES,
  KSB_CAPABILITIES,
  OPERATIONAL_STATES,
  PUBLICATION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];
export type KnowledgeSharingBusCapability = (typeof KSB_CAPABILITIES)[number];

export type KnowledgeSubscription = {
  workerId: string;
  categories: string[];
  subscribedAt: string;
};

export type KnowledgeUsageEvent = {
  workerId: string;
  knowledgeId: string;
  retrievedAt: string;
};

/** Machine-readable Knowledge Record (Q0-23). */
export type KnowledgeRecord = {
  knowledgeId: string;
  timestamp: string;
  sourceWorker: string;
  businessId: string;
  missionId: string;
  knowledgeCategory: KnowledgeCategory | string;
  knowledgeTitle: string;
  knowledgeSummary: string;
  supportingEvidence: string[];
  relatedPlaybooks: string[];
  confidenceScore: number;
  version: string;
  publicationStatus: PublicationStatus;
  metadataVersion: string;
  knowledgeTraceId: string;
  validationStatus: ValidationStatus;
  classificationLabels: string[];
  usageCount: number;
  subscribers: string[];
  versionHistory: string[];
  /** Explicit Q0-23 boundaries. */
  neverExecuteWorkerTasks: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  workerTasksExecuted: false;
  executionMemoryReplaced: false;
  decisionMemoryReplaced: false;
  pillowOverridden: false;
  grandKingOverridden: false;
  preserveKnowledgeTraceability: true;
  preserveAuditability: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

/** Input for Q0-23 — collect/validate/publish/share only. */
export type KnowledgeSharingBusInput = {
  knowledgeId?: string | null;
  sourceWorker?: string | null;
  businessId?: string | null;
  missionId?: string | null;
  knowledgeCategory?: KnowledgeCategory | string | null;
  knowledgeTitle?: string | null;
  knowledgeSummary?: string | null;
  supportingEvidence?: string[];
  relatedPlaybooks?: string[];
  confidenceScore?: number | null;
  version?: string | null;
  classificationHints?: string[];
  subscriberWorkerId?: string | null;
  subscriptionCategories?: string[];
  retrievingWorkerId?: string | null;
  archiveReason?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeWorkerTasks?: boolean;
  replaceExecutionMemory?: boolean;
  replaceDecisionMemory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
};

export type KnowledgeSharingBusValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type KnowledgeSharingBusEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-KSB-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: KnowledgeSharingBusCapability[];
  totalKnowledgeRecords: number;
  publishedCount: number;
  archivedCount: number;
  subscriptionCount: number;
  lastCategory: KnowledgeCategory | string | null;
  metadataVersion: string;
};

export type KnowledgeSharingBusRunReport = {
  knowledgeRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "submit"
    | "validate"
    | "classify"
    | "categorize"
    | "version"
    | "publish"
    | "subscribe"
    | "retrieve"
    | "track_usage"
    | "archive"
    | "list"
    | "diagnostics";
  engineRecord: KnowledgeSharingBusEngineRecord;
  records: KnowledgeRecord[];
  classificationLabels: string[];
  published: boolean;
  retrievedBy: string | null;
  validation: KnowledgeSharingBusValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type KnowledgeSharingBusState = {
  engineVersion: "PILLOW-KSB-001";
  missionId: "Q0-23";
  status: EngineStatus;
  initializedAt: string;
  configuration: KnowledgeSharingBusConfiguration;
  latestReport: KnowledgeSharingBusRunReport | null;
  engineRecord: KnowledgeSharingBusEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalKnowledgeRecords: number;
    publishedCount: number;
    archivedCount: number;
    subscriptionCount: number;
    lastCategory: KnowledgeCategory | string | null;
    notes: string[];
  };
};

export type KnowledgeSharingBusCockpitSnapshot = {
  missionId: "Q0-23";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalKnowledgeRecords: number;
  latestKnowledgeId: string | null;
  publishedCount: number;
  neverExecuteWorkerTasks: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};
