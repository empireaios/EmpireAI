import type { CrossEmpireGovernanceEngineConfiguration } from "./configuration.js";
import type {
  CEG_CAPABILITIES,
  COMPLIANCE_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CrossEmpireGovernanceCapability = (typeof CEG_CAPABILITIES)[number];

export type CrossEmpireGovernanceInput = {
  companyReference?: string;
  governanceCategory?: string;
  constitutionalRuleReference?: string;
  complianceScore?: number;
  riskHint?: RiskLevel;
  recommendationSummary?: string;
  validated?: boolean;
  approveNonCompliant?: boolean;
  policyConflictHint?: boolean;
  violationHint?: boolean;
};

export type GovernanceRecord = {
  governanceRecordId: string;
  timestamp: string;
  companyReference: string;
  governanceCategory: string;
  constitutionalRuleReference: string;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverBypassConstitutionalGovernance: true;
  neverApproveNonCompliantOperationsAutomatically: true;
  approvedNonCompliantOperation: false;
  preserveGovernanceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  governanceTraceId: string;
  maskSensitiveValues: true;
};

export type GovernanceRecommendation = {
  recommendationId: string;
  timestamp: string;
  governanceRecordId: string;
  recommendationSummary: string;
  riskLevel: RiskLevel;
  structuralSignalOnly: true;
  neverBypassConstitutionalGovernance: true;
  neverApproveNonCompliantOperationsAutomatically: true;
  approvedNonCompliantOperation: false;
};

export type GovernanceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CrossEmpireGovernanceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-CEG-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CrossEmpireGovernanceCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    executiveEmpireDashboard: boolean;
    empireSelfImprovementEngine: boolean;
  };
  metadataVersion: string;
};

export type CrossEmpireGovernanceRunReport = {
  governanceRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: CrossEmpireGovernanceEngineRecord;
  governanceRecords: GovernanceRecord[];
  recommendations: GovernanceRecommendation[];
  validation: GovernanceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CrossEmpireGovernanceState = {
  engineVersion: "PILLOW-CEG-001";
  missionId: "X5-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: CrossEmpireGovernanceEngineConfiguration;
  latestReport: CrossEmpireGovernanceRunReport | null;
  engineRecord: CrossEmpireGovernanceEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: GovernanceValidationReport["decision"] | null;
    totalGovernanceRecords: number;
    notes: string[];
  };
};

export type CrossEmpireGovernanceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: GovernanceValidationReport["decision"] | null;
  totalGovernanceRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
