/** PILLOW-SCI-001 — Shared Customer Intelligence types (X2-12). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  SCI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";

export type SharedCustomerIntelligenceVersion = "PILLOW-SCI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type SciCapability = (typeof SCI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type CustomerIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SciCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
    multiCompanyRegistry: boolean;
    crossBusinessKnowledgeEngine: boolean;
    crossCompanyResourceEngine: boolean;
    customerIdentityEngine: boolean;
    customerOperationsCertification: boolean;
  };
  metadataVersion: string;
};

export type CustomerIntelligenceRecord = {
  customerIntelligenceId: string;
  timestamp: string;
  customerReference: string;
  associatedCompanies: string[];
  customerProfileSummary: string;
  behaviourSummary: string;
  lifetimeValueEstimate: number;
  recommendedOpportunities: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
  preferenceSignals: string[];
  riskLevel: RiskLevel;
  crossCompanyRelationship: boolean;
  structuralSignalOnly: true;
  privacySafe: true;
  sensitiveCustomerData: false;
};

export type CustomerRiskSignal = {
  riskId: string;
  timestamp: string;
  customerReference: string;
  riskType: "churn" | "fraud" | "concentration" | "privacy" | "sync_failure";
  severity: RiskLevel;
  rationale: string;
  structuralSignalOnly: true;
};

export type CustomerIntelligenceRecommendation = {
  recommendationId: string;
  timestamp: string;
  customerReference: string | null;
  companyReference: string | null;
  recommendationType:
    | "cross_sell"
    | "retain"
    | "upsell"
    | "resolve_identity"
    | "mitigate_risk"
    | "manual_review";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type CustomerIntelligenceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CustomerIntelligenceRunReport = {
  customerIntelligenceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "consolidate_knowledge"
    | "resolve_identity"
    | "analyze_behaviour"
    | "generate_insights"
    | "detect_cross_sell"
    | "detect_risks"
    | "recommend"
    | "diagnostics";
  engineRecord: CustomerIntelligenceEngineRecord;
  intelligenceRecords: CustomerIntelligenceRecord[];
  riskSignals: CustomerRiskSignal[];
  recommendations: CustomerIntelligenceRecommendation[];
  validation: CustomerIntelligenceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CustomerIntelligenceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CustomerIntelligenceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalIntelligenceRecords: number;
  crossCompanyRelationships: number;
  highRiskCustomers: number;
  notes: string[];
};

export type CustomerIntelligencePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  consolidationsRun: number;
  identityResolutions: number;
  behaviourAnalyses: number;
  insightsGenerated: number;
  crossSellDetections: number;
  riskDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CustomerIntelligenceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SharedCustomerIntelligenceState = {
  engineVersion: SharedCustomerIntelligenceVersion;
  missionId: "X2-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: SharedCustomerIntelligenceConfiguration;
  latestReport: CustomerIntelligenceRunReport | null;
  engineRecord: CustomerIntelligenceEngineRecord | null;
  health: CustomerIntelligenceHealthReport;
  performance: CustomerIntelligencePerformanceStats;
};

export type CustomerIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CustomerIntelligenceValidationReport["decision"] | null;
  totalIntelligenceRecords: number;
  crossCompanyRelationships: number;
  highRiskCustomers: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectSharedCustomerIntelligenceInput = {
  forceReconnect?: boolean;
};

export type ConsolidateCustomerKnowledgeInput = {
  customerReference: string;
  companyReferences?: string[];
  profileSummary?: string;
  preferenceSignals?: string[];
  lifetimeValueHint?: number;
  validated?: boolean;
};

export type ResolveCustomerIdentityInput = {
  customerReference: string;
  companyReferences: string[];
  validated?: boolean;
};

export type AnalyzeCustomerBehaviourInput = {
  customerReference: string;
  behaviourSignals?: string[];
  validated?: boolean;
};

export type GenerateCustomerInsightsInput = {
  customerReference?: string;
  validated?: boolean;
};

export type DetectCrossSellInput = {
  customerReference?: string;
  validated?: boolean;
};

export type DetectCustomerRisksInput = {
  customerReference?: string;
  validated?: boolean;
};

export type RecommendCustomerIntelligenceInput = {
  customerReference?: string;
  companyReference?: string;
};

export type RunCustomerIntelligenceDiagnosticsInput = {
  customerReference?: string;
};
