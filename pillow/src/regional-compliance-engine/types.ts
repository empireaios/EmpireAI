/** PILLOW-RCE-001 — Regional Compliance Engine types (X4-06). */

import type {
  COMPLIANCE_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RCE_CAPABILITIES,
  REGULATION_CATEGORIES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { RegionalComplianceEngineConfiguration } from "./configuration.js";

export type RegionalComplianceEngineVersion = "PILLOW-RCE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RceCapability = (typeof RCE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type RegulationCategory = (typeof REGULATION_CATEGORIES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type ComplianceRecord = {
  complianceRecordId: string;
  timestamp: string;
  companyReference: string;
  country: string;
  regulationCategory: RegulationCategory;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  requiredActions: string[];
  validationStatus: ValidationStatus;
  metadataVersion: string;
  riskScore: number;
  alignmentScore: number;
  violationDetected: boolean;
  structuralSignalOnly: true;
  neverFalselyCertifyCompliance: true;
  certificationClaim: "none";
};

export type RegionalComplianceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RceCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
  };
  metadataVersion: string;
};

export type ComplianceRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  country: string;
  regulationCategory: RegulationCategory;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverFalselyCertifyCompliance: true;
  certificationClaim: "none";
};

export type ComplianceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RceRunReport = {
  complianceRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_country_requirements"
    | "monitor_regulatory_changes"
    | "manage_business_rules"
    | "assess_operational"
    | "assess_marketplace"
    | "assess_data_protection"
    | "detect_violations"
    | "assess_risks"
    | "recommend_compliance"
    | "diagnostics";
  engineRecord: RegionalComplianceEngineRecord;
  complianceRecords: ComplianceRecord[];
  recommendations: ComplianceRecommendation[];
  validation: ComplianceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ComplianceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalComplianceRecords: number;
  violationCount: number;
  highRiskCount: number;
  notes: string[];
};

export type RcePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  countryRequirementOps: number;
  regulatoryMonitors: number;
  businessRuleOps: number;
  operationalAssessments: number;
  marketplaceAssessments: number;
  dataProtectionAssessments: number;
  violationDetections: number;
  riskAssessments: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RegionalComplianceEngineState = {
  engineVersion: RegionalComplianceEngineVersion;
  missionId: "X4-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: RegionalComplianceEngineConfiguration;
  latestReport: RceRunReport | null;
  engineRecord: RegionalComplianceEngineRecord | null;
  health: RceHealthReport;
  performance: RcePerformanceStats;
};

export type RceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ComplianceValidationReport["decision"] | null;
  totalComplianceRecords: number;
  violationCount: number;
  highRiskCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type RceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectRegionalComplianceEngineInput = Record<string, unknown>;

export type ComplianceAnalysisInput = {
  companyReference?: string;
  country?: string;
  regulationCategory?: RegulationCategory;
  alignmentHint?: number;
  riskHint?: number;
  violationHint?: boolean;
  validated?: boolean;
};

export type RunRceDiagnosticsInput = {
  companyReference?: string;
  country?: string;
};
