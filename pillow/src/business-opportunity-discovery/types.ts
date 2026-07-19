/** PILLOW-BOD-001 — Business Opportunity Discovery types (X1-02). */

import type {
  BOD_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPPORTUNITY_CATEGORIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";

export type BusinessOpportunityDiscoveryVersion = "PILLOW-BOD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];
export type BodCapability = (typeof BOD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type OpportunityEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: BodCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
  };
  metadataVersion: string;
};

export type OpportunityRecord = {
  opportunityId: string;
  timestamp: string;
  opportunityCategory: OpportunityCategory;
  industry: string;
  marketReference: string;
  opportunityScore: number;
  estimatedProfitability: number;
  confidenceScore: number;
  ranking: number | null;
  /** Structural signal only — never fabricated live market facts. */
  structuralSignalOnly: true;
  fabricatedMarketInformation: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type OpportunityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityRunReport = {
  opportunityRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "discover_opportunities"
    | "monitor_market_trends"
    | "monitor_emerging_industries"
    | "monitor_customer_demand"
    | "monitor_competitor_activity"
    | "identify_underserved_markets"
    | "identify_profitable_niches"
    | "score_opportunities"
    | "rank_opportunities";
  engineRecord: OpportunityEngineRecord;
  opportunityRecords: OpportunityRecord[];
  validation: OpportunityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: OpportunityValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalOpportunityRecords: number;
  averageOpportunityScore: number;
  notes: string[];
};

export type OpportunityPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  discoveriesRun: number;
  monitoringRuns: number;
  scoringRuns: number;
  rankingRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type OpportunityLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type BusinessOpportunityDiscoveryState = {
  engineVersion: BusinessOpportunityDiscoveryVersion;
  missionId: "X1-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: BusinessOpportunityDiscoveryConfiguration;
  latestReport: OpportunityRunReport | null;
  engineRecord: OpportunityEngineRecord | null;
  health: OpportunityHealthReport;
  performance: OpportunityPerformanceStats;
};

export type OpportunityCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: OpportunityValidationReport["decision"] | null;
  totalOpportunityRecords: number;
  averageOpportunityScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectBusinessOpportunityDiscoveryInput = {
  forceReconnect?: boolean;
};

export type DiscoverOpportunitiesInput = {
  industry?: string;
  marketReference?: string;
  category?: OpportunityCategory;
  validated?: boolean;
};

export type OpportunityActionInput = {
  opportunityId?: string;
  industry?: string;
  marketReference?: string;
  validated?: boolean;
};
