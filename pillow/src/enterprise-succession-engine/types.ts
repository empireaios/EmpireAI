import type { EnterpriseSuccessionEngineConfiguration } from "./configuration.js";
import type {
  CONTINUITY_STATUSES,
  ENGINE_STATUSES,
  ESE_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ContinuityStatus = (typeof CONTINUITY_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type EnterpriseSuccessionCapability = (typeof ESE_CAPABILITIES)[number];

export type EnterpriseSuccessionInput = {
  organizationalUnit?: string;
  successionCategory?: string;
  readinessScore?: number;
  riskHint?: RiskLevel;
  recommendationSummary?: string;
  validated?: boolean;
  modifyGovernanceApprovedPlan?: boolean;
  gapHint?: boolean;
  successionRiskHint?: boolean;
};

export type SuccessionRecord = {
  successionRecordId: string;
  timestamp: string;
  organizationalUnit: string;
  successionCategory: string;
  continuityStatus: ContinuityStatus;
  readinessScore: number;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyGovernanceApprovedSuccessionPlansAutomatically: true;
  modifiedGovernanceApprovedSuccessionPlan: false;
  preserveSuccessionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  successionTraceId: string;
  maskSensitiveValues: true;
};

export type SuccessionRecommendation = {
  recommendationId: string;
  timestamp: string;
  successionRecordId: string;
  recommendationSummary: string;
  readinessScore: number;
  riskLevel: RiskLevel;
  structuralSignalOnly: true;
  neverModifyGovernanceApprovedSuccessionPlansAutomatically: true;
  modifiedGovernanceApprovedSuccessionPlan: false;
};

export type SuccessionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EnterpriseSuccessionEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ESE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: EnterpriseSuccessionCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empireResilienceEngine: boolean;
    autonomousInvestmentEngine: boolean;
  };
  metadataVersion: string;
};

export type EnterpriseSuccessionRunReport = {
  successionRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: EnterpriseSuccessionEngineRecord;
  successionRecords: SuccessionRecord[];
  recommendations: SuccessionRecommendation[];
  validation: SuccessionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EnterpriseSuccessionState = {
  engineVersion: "PILLOW-ESE-001";
  missionId: "X5-13";
  status: EngineStatus;
  initializedAt: string;
  configuration: EnterpriseSuccessionEngineConfiguration;
  latestReport: EnterpriseSuccessionRunReport | null;
  engineRecord: EnterpriseSuccessionEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: SuccessionValidationReport["decision"] | null;
    totalSuccessionRecords: number;
    notes: string[];
  };
};

export type EnterpriseSuccessionCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: SuccessionValidationReport["decision"] | null;
  totalSuccessionRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
