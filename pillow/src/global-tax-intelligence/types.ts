/** PILLOW-GTI-001 — Global Tax Intelligence types (X4-07). */

import type {
  COMPLIANCE_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  GTI_CAPABILITIES,
  TAX_CATEGORIES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";

export type GlobalTaxIntelligenceVersion = "PILLOW-GTI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type GtiCapability = (typeof GTI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type TaxCategory = (typeof TAX_CATEGORIES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type TaxIntelligenceRecord = {
  taxIntelligenceId: string;
  timestamp: string;
  companyReference: string;
  country: string;
  taxCategory: TaxCategory;
  estimatedTaxObligation: number;
  obligationUnit: "structural_units";
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  riskScore: number;
  optimizationOpportunity: boolean;
  calculationTraceId: string;
  structuralSignalOnly: true;
  neverProvideUnvalidatedTaxAsLegalAdvice: true;
  authoritativeLegalAdviceClaim: "none";
};

export type GlobalTaxIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: GtiCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
    regionalComplianceEngine: boolean;
  };
  metadataVersion: string;
};

export type TaxRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  country: string;
  taxCategory: TaxCategory;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverProvideUnvalidatedTaxAsLegalAdvice: true;
  authoritativeLegalAdviceClaim: "none";
};

export type TaxValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type GtiRunReport = {
  taxRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_country_tax_rules"
    | "monitor_tax_regulation_updates"
    | "manage_indirect_taxes"
    | "manage_direct_taxes"
    | "manage_cross_border"
    | "estimate_tax_obligation"
    | "detect_compliance_risks"
    | "detect_optimization_opportunities"
    | "recommend_tax"
    | "diagnostics";
  engineRecord: GlobalTaxIntelligenceEngineRecord;
  taxRecords: TaxIntelligenceRecord[];
  recommendations: TaxRecommendation[];
  validation: TaxValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GtiHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: TaxValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalTaxRecords: number;
  highRiskCount: number;
  optimizationCount: number;
  notes: string[];
};

export type GtiPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  countryRuleOps: number;
  regulationMonitors: number;
  indirectOps: number;
  directOps: number;
  crossBorderOps: number;
  obligationEstimates: number;
  complianceRiskDetections: number;
  optimizationDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GlobalTaxIntelligenceState = {
  engineVersion: GlobalTaxIntelligenceVersion;
  missionId: "X4-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalTaxIntelligenceConfiguration;
  latestReport: GtiRunReport | null;
  engineRecord: GlobalTaxIntelligenceEngineRecord | null;
  health: GtiHealthReport;
  performance: GtiPerformanceStats;
};

export type GtiCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: TaxValidationReport["decision"] | null;
  totalTaxRecords: number;
  highRiskCount: number;
  optimizationCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type GtiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectGlobalTaxIntelligenceInput = Record<string, unknown>;

export type TaxAnalysisInput = {
  companyReference?: string;
  country?: string;
  taxCategory?: TaxCategory;
  obligationHint?: number;
  riskHint?: number;
  optimizationHint?: boolean;
  validated?: boolean;
};

export type RunGtiDiagnosticsInput = {
  companyReference?: string;
  country?: string;
};
