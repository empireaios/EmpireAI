/** PILLOW-TAL-001 — Global Talent Intelligence types (X4-13). */

import type {
  DECISION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  TAL_CAPABILITIES,
  VALIDATION_STATUSES,
  WORKFORCE_CATEGORIES,
} from "./paths.js";
import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";

export type GlobalTalentIntelligenceVersion = "PILLOW-TAL-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type TalCapability = (typeof TAL_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type WorkforceCategory = (typeof WORKFORCE_CATEGORIES)[number];
export type DecisionStatus = (typeof DECISION_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type WorkforceIntelligenceRecord = {
  workforceIntelligenceId: string;
  timestamp: string;
  companyReference: string;
  region: string;
  workforceCategory: WorkforceCategory;
  capabilityScore: number;
  availabilityScore: number;
  utilizationScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  decisionStatus: DecisionStatus;
  riskLevel: RiskLevel;
  workforceShortageDetected: boolean;
  workforceOpportunityDetected: boolean;
  workforceTraceId: string;
  structuralSignalOnly: true;
  neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true;
  unvalidatedDecisionClaim: "none";
};

export type GlobalTalentIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: TalCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
    regionalComplianceEngine: boolean;
    globalTaxIntelligence: boolean;
    internationalLogisticsEngine: boolean;
    globalMarketIntelligence: boolean;
    executiveGlobalDashboard: boolean;
    globalBrandManagement: boolean;
    internationalPartnershipEngine: boolean;
  };
  metadataVersion: string;
};

export type WorkforceRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  region: string;
  workforceCategory: WorkforceCategory;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true;
  unvalidatedDecisionClaim: "none";
};

export type WorkforceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TalRunReport = {
  workforceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_global_workforce_availability"
    | "monitor_regional_talent_markets"
    | "monitor_workforce_capabilities"
    | "monitor_workforce_performance"
    | "monitor_workforce_costs"
    | "monitor_workforce_utilization"
    | "detect_workforce_shortages"
    | "detect_workforce_opportunities"
    | "recommend_workforce"
    | "diagnostics";
  engineRecord: GlobalTalentIntelligenceEngineRecord;
  workforceRecords: WorkforceIntelligenceRecord[];
  recommendations: WorkforceRecommendation[];
  validation: WorkforceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TalHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: WorkforceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalWorkforceRecords: number;
  shortageCount: number;
  opportunityCount: number;
  notes: string[];
};

export type TalPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  availabilityMonitors: number;
  regionalTalentOps: number;
  capabilityMonitors: number;
  performanceMonitors: number;
  costMonitors: number;
  utilizationMonitors: number;
  shortageDetections: number;
  opportunityDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GlobalTalentIntelligenceState = {
  engineVersion: GlobalTalentIntelligenceVersion;
  missionId: "X4-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalTalentIntelligenceConfiguration;
  latestReport: TalRunReport | null;
  engineRecord: GlobalTalentIntelligenceEngineRecord | null;
  health: TalHealthReport;
  performance: TalPerformanceStats;
};

export type TalCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: WorkforceValidationReport["decision"] | null;
  totalWorkforceRecords: number;
  shortageCount: number;
  opportunityCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type TalLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectGlobalTalentIntelligenceInput = Record<string, unknown>;

export type WorkforceAnalysisInput = {
  companyReference?: string;
  region?: string;
  workforceCategory?: WorkforceCategory;
  capabilityHint?: number;
  availabilityHint?: number;
  utilizationHint?: number;
  costHint?: number;
  shortageHint?: boolean;
  opportunityHint?: boolean;
  validated?: boolean;
};

export type RunTalDiagnosticsInput = {
  companyReference?: string;
  region?: string;
};
