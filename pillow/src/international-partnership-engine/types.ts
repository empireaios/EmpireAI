/** PILLOW-IPE-001 — International Partnership Engine types (X4-12). */

import type {
  APPROVAL_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IPE_CAPABILITIES,
  OPERATIONAL_STATES,
  PARTNERSHIP_CATEGORIES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";

export type InternationalPartnershipEngineVersion = "PILLOW-IPE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type IpeCapability = (typeof IPE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type PartnershipCategory = (typeof PARTNERSHIP_CATEGORIES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type PartnershipRecord = {
  partnershipId: string;
  timestamp: string;
  companyReference: string;
  partnerReference: string;
  country: string;
  partnershipCategory: PartnershipCategory;
  performanceScore: number;
  reliabilityScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  approvalStatus: ApprovalStatus;
  riskLevel: RiskLevel;
  partnershipRiskDetected: boolean;
  partnershipOpportunityDetected: boolean;
  partnershipTraceId: string;
  structuralSignalOnly: true;
  neverApproveStrategicPartnershipsWithoutValidation: true;
  unvalidatedApprovalClaim: "none";
};

export type InternationalPartnershipEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: IpeCapability[];
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
  };
  metadataVersion: string;
};

export type PartnershipRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  partnerReference: string;
  country: string;
  partnershipCategory: PartnershipCategory;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverApproveStrategicPartnershipsWithoutValidation: true;
  unvalidatedApprovalClaim: "none";
};

export type PartnershipValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type IpeRunReport = {
  partnershipRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_strategic_partnerships"
    | "manage_regional_partner_networks"
    | "evaluate_prospective_partners"
    | "monitor_partner_performance"
    | "monitor_partner_reliability"
    | "monitor_partnership_value"
    | "detect_partnership_risks"
    | "detect_partnership_opportunities"
    | "recommend_partnership"
    | "diagnostics";
  engineRecord: InternationalPartnershipEngineRecord;
  partnershipRecords: PartnershipRecord[];
  recommendations: PartnershipRecommendation[];
  validation: PartnershipValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type IpeHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: PartnershipValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPartnershipRecords: number;
  riskCount: number;
  opportunityCount: number;
  notes: string[];
};

export type IpePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  strategicPartnershipOps: number;
  regionalNetworkOps: number;
  prospectiveEvaluations: number;
  performanceMonitors: number;
  reliabilityMonitors: number;
  valueMonitors: number;
  riskDetections: number;
  opportunityDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type InternationalPartnershipEngineState = {
  engineVersion: InternationalPartnershipEngineVersion;
  missionId: "X4-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: InternationalPartnershipEngineConfiguration;
  latestReport: IpeRunReport | null;
  engineRecord: InternationalPartnershipEngineRecord | null;
  health: IpeHealthReport;
  performance: IpePerformanceStats;
};

export type IpeCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: PartnershipValidationReport["decision"] | null;
  totalPartnershipRecords: number;
  riskCount: number;
  opportunityCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type IpeLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectInternationalPartnershipEngineInput = Record<string, unknown>;

export type PartnershipAnalysisInput = {
  companyReference?: string;
  partnerReference?: string;
  country?: string;
  partnershipCategory?: PartnershipCategory;
  performanceHint?: number;
  reliabilityHint?: number;
  riskHint?: boolean;
  opportunityHint?: boolean;
  validated?: boolean;
};

export type RunIpeDiagnosticsInput = {
  companyReference?: string;
  partnerReference?: string;
  country?: string;
};
