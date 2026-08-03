import type { GrandKingAdvisoryEngineConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  GKA_CAPABILITIES,
  HEALTH_STATUSES,
  IMPACT_LEVELS,
  OPERATIONAL_STATES,
  PRIORITY_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];
export type BusinessImpact = (typeof IMPACT_LEVELS)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type GrandKingAdvisoryCapability = (typeof GKA_CAPABILITIES)[number];

export type GrandKingAdvisoryInput = {
  strategicCategory?: string;
  enterpriseScope?: string;
  priorityLevel?: PriorityLevel;
  businessImpact?: BusinessImpact;
  priorityScore?: number;
  recommendationSummary?: string;
  supportingEvidence?: string;
  validated?: boolean;
  executeDecisionAutomatically?: boolean;
  governanceApproved?: boolean;
  riskHint?: boolean;
  opportunityHint?: boolean;
};

export type AdvisoryRecord = {
  advisoryId: string;
  timestamp: string;
  strategicCategory: string;
  enterpriseScope: string;
  priorityLevel: PriorityLevel;
  businessImpact: BusinessImpact;
  recommendationSummary: string;
  supportingEvidence: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  structuralSignalOnly: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true;
  executedExecutiveDecisionAutomatically: false;
  preserveAdvisoryTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  advisoryTraceId: string;
  maskSensitiveValues: true;
  priorityScore: number;
};

export type AdvisoryRecommendation = {
  recommendationId: string;
  timestamp: string;
  advisoryId: string;
  recommendationSummary: string;
  priorityLevel: PriorityLevel;
  priorityScore: number;
  structuralSignalOnly: true;
  neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true;
  executedExecutiveDecisionAutomatically: false;
};

export type AdvisoryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type GrandKingAdvisoryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-GKA-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: GrandKingAdvisoryCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    empireIntelligenceFramework: boolean;
    executiveEmpireDashboard: boolean;
    empireLegacyEngine: boolean;
  };
  metadataVersion: string;
};

export type GrandKingAdvisoryRunReport = {
  advisoryRunReportId: string;
  runTimestamp: string;
  action: string;
  engineRecord: GrandKingAdvisoryEngineRecord;
  advisoryRecords: AdvisoryRecord[];
  recommendations: AdvisoryRecommendation[];
  validation: AdvisoryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GrandKingAdvisoryState = {
  engineVersion: "PILLOW-GKA-001";
  missionId: "X5-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: GrandKingAdvisoryEngineConfiguration;
  latestReport: GrandKingAdvisoryRunReport | null;
  engineRecord: GrandKingAdvisoryEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: AdvisoryValidationReport["decision"] | null;
    totalAdvisoryRecords: number;
    notes: string[];
  };
};

export type GrandKingAdvisoryCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: AdvisoryValidationReport["decision"] | null;
  totalAdvisoryRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};
