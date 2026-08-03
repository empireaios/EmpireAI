/** PILLOW-BMG-001 — Business Model Generator types (X1-04). */

import type {
  BMG_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  REVENUE_MODELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BusinessModelGeneratorConfiguration } from "./configuration.js";

export type BusinessModelGeneratorVersion = "PILLOW-BMG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RevenueModelType = (typeof REVENUE_MODELS)[number];
export type BmgCapability = (typeof BMG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type BusinessModelEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BmgCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessOpportunityDiscovery: boolean;
    marketValidationEngine: boolean;
  };
  metadataVersion: string;
};

export type BusinessModelRecord = {
  businessModelId: string;
  timestamp: string;
  opportunityReference: string;
  revenueModel: RevenueModelType;
  customerSegment: string;
  valueProposition: string;
  costStructure: string;
  distributionChannels: string;
  partnershipStrategy: string;
  operationalModel: string;
  businessModelScore: number;
  /** Structural signal only — never fabricated live validation facts. */
  structuralSignalOnly: true;
  fabricatedValidationResults: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type BusinessModelValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type BusinessModelRunReport = {
  businessModelRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "generate_business_model"
    | "generate_revenue_model"
    | "generate_cost_structure"
    | "generate_value_proposition"
    | "generate_customer_segments"
    | "generate_distribution_channels"
    | "generate_partnership_strategies"
    | "generate_operational_models"
    | "score_business_models";
  engineRecord: BusinessModelEngineRecord;
  businessModelRecords: BusinessModelRecord[];
  validation: BusinessModelValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type BusinessModelHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BusinessModelValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBusinessModelRecords: number;
  averageBusinessModelScore: number;
  notes: string[];
};

export type BusinessModelPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  generationsRun: number;
  revenueModelRuns: number;
  segmentRuns: number;
  scoringRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type BusinessModelLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BusinessModelGeneratorState = {
  engineVersion: BusinessModelGeneratorVersion;
  missionId: "X1-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessModelGeneratorConfiguration;
  latestReport: BusinessModelRunReport | null;
  engineRecord: BusinessModelEngineRecord | null;
  health: BusinessModelHealthReport;
  performance: BusinessModelPerformanceStats;
};

export type BusinessModelCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BusinessModelValidationReport["decision"] | null;
  totalBusinessModelRecords: number;
  averageBusinessModelScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBusinessModelGeneratorInput = {
  forceReconnect?: boolean;
};

export type GenerateBusinessModelInput = {
  opportunityReference?: string;
  industry?: string;
  revenueModel?: RevenueModelType;
  validated?: boolean;
};

export type BusinessModelActionInput = {
  businessModelId?: string;
  opportunityReference?: string;
  industry?: string;
  validated?: boolean;
};
