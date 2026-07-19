/** PILLOW-MVE-001 — Market Validation Engine types (X1-03). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INVESTMENT_RECOMMENDATIONS,
  MARKET_RISKS,
  MVE_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketValidationEngineConfiguration } from "./configuration.js";

export type MarketValidationEngineVersion = "PILLOW-MVE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type InvestmentRecommendation = (typeof INVESTMENT_RECOMMENDATIONS)[number];
export type MarketRisk = (typeof MARKET_RISKS)[number];
export type MveCapability = (typeof MVE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type MarketValidationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MveCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessOpportunityDiscovery: boolean;
  };
  metadataVersion: string;
};

export type MarketValidationRecord = {
  validationId: string;
  timestamp: string;
  opportunityReference: string;
  industry: string;
  marketDemandScore: number;
  competitionScore: number;
  profitabilityScore: number;
  marketSizeScore: number;
  customerInterestScore: number;
  validationConfidence: number;
  investmentRecommendation: InvestmentRecommendation;
  identifiedRisks: MarketRisk[];
  /** Structural signal only — never fabricated live validation facts. */
  structuralSignalOnly: true;
  fabricatedValidationResults: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type MarketValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MarketValidationRunReport = {
  marketValidationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "validate_opportunity"
    | "validate_market_demand"
    | "validate_customer_interest"
    | "validate_competitive_landscape"
    | "validate_market_size"
    | "validate_profitability_potential"
    | "calculate_validation_confidence"
    | "identify_market_risks"
    | "generate_investment_recommendation";
  engineRecord: MarketValidationEngineRecord;
  validationRecords: MarketValidationRecord[];
  validation: MarketValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MarketValidationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: MarketValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalValidationRecords: number;
  averageValidationConfidence: number;
  notes: string[];
};

export type MarketValidationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  validationsRun: number;
  demandAnalyses: number;
  customerValidations: number;
  competitiveValidations: number;
  scoringRuns: number;
  recommendationRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type MarketValidationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketValidationEngineState = {
  engineVersion: MarketValidationEngineVersion;
  missionId: "X1-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketValidationEngineConfiguration;
  latestReport: MarketValidationRunReport | null;
  engineRecord: MarketValidationEngineRecord | null;
  health: MarketValidationHealthReport;
  performance: MarketValidationPerformanceStats;
};

export type MarketValidationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: MarketValidationReport["decision"] | null;
  totalValidationRecords: number;
  averageValidationConfidence: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectMarketValidationEngineInput = {
  forceReconnect?: boolean;
};

export type ValidateOpportunityInput = {
  opportunityReference?: string;
  industry?: string;
  validated?: boolean;
};

export type MarketValidationActionInput = {
  validationId?: string;
  opportunityReference?: string;
  industry?: string;
  validated?: boolean;
};
