import type { AutonomousInvestmentEngineConfiguration } from "./configuration.js";
import type {
  AIE_CAPABILITIES,
  ENGINE_STATUSES,
  EXECUTION_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type AutonomousInvestmentCapability = (typeof AIE_CAPABILITIES)[number];

export type AutonomousInvestmentInput = {
  investmentCategory?: string;
  investmentTarget?: string;
  expectedReturn?: number;
  riskScore?: number;
  investmentPriority?: number;
  recommendationSummary?: string;
  validated?: boolean;
  governanceApproved?: boolean;
  underperformingHint?: boolean;
};

export type InvestmentRecord = {
  investmentId: string;
  timestamp: string;
  investmentCategory: string;
  investmentTarget: string;
  expectedReturn: number;
  riskScore: number;
  investmentPriority: number;
  executionStatus: ExecutionStatus;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteInvestmentsWithoutGovernanceApproval: true;
  governanceApproved: boolean;
  executedWithoutGovernanceApproval: false;
  preserveInvestmentTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  investmentTraceId: string;
  maskSensitiveValues: true;
};

export type InvestmentRecommendation = {
  recommendationId: string;
  timestamp: string;
  investmentId: string;
  recommendationSummary: string;
  investmentPriority: number;
  structuralSignalOnly: true;
  neverExecuteInvestmentsWithoutGovernanceApproval: true;
  executedWithoutGovernanceApproval: false;
};

export type InvestmentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousInvestmentEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-AIE-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: AutonomousInvestmentCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    empireCapitalAllocation: boolean;
    crossEmpireGovernanceEngine: boolean;
  };
  metadataVersion: string;
};

export type AutonomousInvestmentRunReport = {
  investmentRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: AutonomousInvestmentEngineRecord;
  investmentRecords: InvestmentRecord[];
  recommendations: InvestmentRecommendation[];
  validation: InvestmentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AutonomousInvestmentState = {
  engineVersion: "PILLOW-AIE-001";
  missionId: "X5-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousInvestmentEngineConfiguration;
  latestReport: AutonomousInvestmentRunReport | null;
  engineRecord: AutonomousInvestmentEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: InvestmentValidationReport["decision"] | null;
    totalInvestmentRecords: number;
    notes: string[];
  };
};

export type AutonomousInvestmentCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: InvestmentValidationReport["decision"] | null;
  totalInvestmentRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
