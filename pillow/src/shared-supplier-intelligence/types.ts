/** PILLOW-SSI-001 — Shared Supplier Intelligence types (X2-13). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  SSI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";

export type SharedSupplierIntelligenceVersion = "PILLOW-SSI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SsiCapability = (typeof SSI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type SupplierIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SsiCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    crossBusinessKnowledgeEngine: boolean;
    crossCompanyResourceEngine: boolean;
    supplierFramework: boolean;
    supplierOperationsCertification: boolean;
  };
  metadataVersion: string;
};

export type SupplierIntelligenceRecord = {
  supplierIntelligenceId: string;
  timestamp: string;
  supplierReference: string;
  associatedCompanies: string[];
  supplierPerformanceScore: number;
  reliabilityScore: number;
  costCompetitivenessScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  riskLevel: RiskLevel;
  duplicateDetected: boolean;
  sharedAcrossCompanies: boolean;
  structuralSignalOnly: true;
  agreementSafe: true;
  sensitiveSupplierData: false;
};

export type SupplierRiskSignal = {
  riskId: string;
  timestamp: string;
  supplierReference: string;
  riskType: "reliability" | "cost" | "duplication" | "concentration" | "sync_failure";
  severity: RiskLevel;
  rationale: string;
  structuralSignalOnly: true;
};

export type SupplierIntelligenceRecommendation = {
  recommendationId: string;
  timestamp: string;
  supplierReference: string | null;
  companyReference: string | null;
  recommendationType:
    | "prefer"
    | "share"
    | "diversify"
    | "replace"
    | "mitigate_risk"
    | "manual_review";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type SupplierIntelligenceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierIntelligenceRunReport = {
  supplierIntelligenceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consolidate_knowledge"
    | "track_performance"
    | "detect_risks"
    | "detect_duplicates"
    | "recommend"
    | "share_intelligence"
    | "diagnostics";
  engineRecord: SupplierIntelligenceEngineRecord;
  intelligenceRecords: SupplierIntelligenceRecord[];
  riskSignals: SupplierRiskSignal[];
  recommendations: SupplierIntelligenceRecommendation[];
  validation: SupplierIntelligenceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierIntelligenceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: SupplierIntelligenceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalIntelligenceRecords: number;
  sharedSuppliers: number;
  highRiskSuppliers: number;
  notes: string[];
};

export type SupplierIntelligencePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  consolidationsRun: number;
  performanceAnalyses: number;
  riskDetections: number;
  duplicateDetections: number;
  recommendationsGenerated: number;
  shareOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierIntelligenceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SharedSupplierIntelligenceState = {
  engineVersion: SharedSupplierIntelligenceVersion;
  missionId: "X2-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: SharedSupplierIntelligenceConfiguration;
  latestReport: SupplierIntelligenceRunReport | null;
  engineRecord: SupplierIntelligenceEngineRecord | null;
  health: SupplierIntelligenceHealthReport;
  performance: SupplierIntelligencePerformanceStats;
};

export type SupplierIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: SupplierIntelligenceValidationReport["decision"] | null;
  totalIntelligenceRecords: number;
  sharedSuppliers: number;
  highRiskSuppliers: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectSharedSupplierIntelligenceInput = {
  forceReconnect?: boolean;
};

export type ConsolidateSupplierKnowledgeInput = {
  supplierReference: string;
  companyReferences?: string[];
  performanceScore?: number;
  reliabilityScore?: number;
  costCompetitivenessScore?: number;
  validated?: boolean;
};

export type TrackSupplierPerformanceInput = {
  supplierReference: string;
  performanceScore?: number;
  reliabilityScore?: number;
  costCompetitivenessScore?: number;
  validated?: boolean;
};

export type DetectSupplierRisksInput = {
  supplierReference?: string;
  validated?: boolean;
};

export type DetectSupplierDuplicatesInput = {
  validated?: boolean;
};

export type RecommendSupplierInput = {
  supplierReference?: string;
  companyReference?: string;
};

export type ShareSupplierIntelligenceInput = {
  supplierReference: string;
  targetCompanies: string[];
  validated?: boolean;
};

export type RunSupplierIntelligenceDiagnosticsInput = {
  supplierReference?: string;
};
