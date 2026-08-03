/** PILLOW-CBK-001 — Cross-Business Knowledge Engine types (X2-04). */

import type {
  CBK_CAPABILITIES,
  DISTRIBUTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  KNOWLEDGE_CATEGORIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";

export type CrossBusinessKnowledgeEngineVersion = "PILLOW-CBK-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export type DistributionStatus = (typeof DISTRIBUTION_STATUSES)[number];
export type CbkCapability = (typeof CBK_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type KnowledgeEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CbkCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    portfolioPerformanceEngine: boolean;
  };
  metadataVersion: string;
};

export type KnowledgeRecord = {
  knowledgeRecordId: string;
  timestamp: string;
  sourceCompany: string;
  knowledgeCategory: KnowledgeCategory;
  knowledgeSummary: string;
  reusabilityScore: number;
  confidenceScore: number;
  distributionStatus: DistributionStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  identityKey: string;
  sharedWith: string[];
  structuralSignalOnly: true;
  confidentialContent: false;
  ranking: number | null;
};

export type KnowledgeRecommendation = {
  recommendationId: string;
  timestamp: string;
  knowledgeRecordId: string | null;
  targetCompany: string | null;
  recommendationType:
    | "collect"
    | "classify"
    | "share"
    | "restrict"
    | "reuse"
    | "archive"
    | "resolve_duplicate";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type KnowledgeValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type KnowledgeRunReport = {
  knowledgeRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "collect_knowledge"
    | "classify_knowledge"
    | "share_knowledge"
    | "detect_duplicates"
    | "rank_knowledge"
    | "recommend"
    | "diagnostics";
  engineRecord: KnowledgeEngineRecord;
  knowledgeRecords: KnowledgeRecord[];
  recommendations: KnowledgeRecommendation[];
  validation: KnowledgeValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type KnowledgeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: KnowledgeValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalKnowledgeRecords: number;
  sharedKnowledgeRecords: number;
  duplicateSignals: number;
  notes: string[];
};

export type KnowledgePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  knowledgeCollected: number;
  classifications: number;
  sharesCompleted: number;
  duplicatesDetected: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type KnowledgeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CrossBusinessKnowledgeEngineState = {
  engineVersion: CrossBusinessKnowledgeEngineVersion;
  missionId: "X2-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrossBusinessKnowledgeEngineConfiguration;
  latestReport: KnowledgeRunReport | null;
  engineRecord: KnowledgeEngineRecord | null;
  health: KnowledgeHealthReport;
  performance: KnowledgePerformanceStats;
};

export type KnowledgeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: KnowledgeValidationReport["decision"] | null;
  totalKnowledgeRecords: number;
  sharedKnowledgeRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCrossBusinessKnowledgeInput = {
  forceReconnect?: boolean;
};

export type CollectKnowledgeInput = {
  sourceCompany: string;
  knowledgeCategory?: KnowledgeCategory;
  knowledgeSummary: string;
  reusabilityScore?: number;
  confidenceScore?: number;
  validated?: boolean;
  allowDuplicate?: boolean;
};

export type ClassifyKnowledgeInput = {
  knowledgeRecordId: string;
  knowledgeCategory: KnowledgeCategory;
  validated?: boolean;
};

export type ShareKnowledgeInput = {
  knowledgeRecordId: string;
  targetCompanies?: string[];
  validated?: boolean;
};

export type DetectDuplicateKnowledgeInput = {
  knowledgeRecordId?: string;
};

export type RankKnowledgeInput = {
  validated?: boolean;
};

export type RecommendKnowledgeInput = {
  targetCompany?: string;
  knowledgeRecordId?: string;
};

export type RunKnowledgeDiagnosticsInput = {
  knowledgeRecordId?: string;
};
