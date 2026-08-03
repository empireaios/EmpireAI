/** PILLOW-GMI-001 — Global Market Intelligence types (X4-09). */

import type {
  ENGINE_STATUSES,
  GMI_CAPABILITIES,
  HEALTH_STATUSES,
  MARKET_CATEGORIES,
  MARKET_SIGNALS,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";

export type GlobalMarketIntelligenceVersion = "PILLOW-GMI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type GmiCapability = (typeof GMI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type MarketCategory = (typeof MARKET_CATEGORIES)[number];
export type MarketSignal = (typeof MARKET_SIGNALS)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type MarketIntelligenceRecord = {
  marketIntelligenceId: string;
  timestamp: string;
  country: string;
  region: string;
  marketCategory: MarketCategory;
  demandScore: number;
  competitionScore: number;
  opportunityScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  marketSignal: MarketSignal;
  riskLevel: RiskLevel;
  rankingPosition: number | null;
  emergingDetected: boolean;
  decliningDetected: boolean;
  marketTraceId: string;
  structuralSignalOnly: true;
  neverRecommendWithUnvalidatedIntelligence: true;
  unvalidatedRecommendationClaim: "none";
};

export type GlobalMarketIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: GmiCapability[];
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
  };
  metadataVersion: string;
};

export type MarketRecommendation = {
  recommendationId: string;
  timestamp: string;
  country: string;
  region: string;
  marketCategory: MarketCategory;
  opportunityScore: number;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverRecommendWithUnvalidatedIntelligence: true;
  unvalidatedRecommendationClaim: "none";
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

export type GmiRunReport = {
  marketRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_international_markets"
    | "monitor_market_trends"
    | "monitor_customer_demand"
    | "monitor_competitor_activity"
    | "monitor_product_opportunities"
    | "monitor_regional_growth"
    | "detect_emerging_markets"
    | "detect_declining_markets"
    | "rank_global_opportunities"
    | "recommend_market"
    | "diagnostics";
  engineRecord: GlobalMarketIntelligenceEngineRecord;
  marketRecords: MarketIntelligenceRecord[];
  recommendations: MarketRecommendation[];
  validation: MarketValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GmiHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: MarketValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalMarketRecords: number;
  emergingCount: number;
  decliningCount: number;
  notes: string[];
};

export type GmiPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  marketMonitors: number;
  trendAnalyses: number;
  demandMonitors: number;
  competitorAnalyses: number;
  productOpportunityOps: number;
  regionalGrowthOps: number;
  emergingDetections: number;
  decliningDetections: number;
  opportunityRankings: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GlobalMarketIntelligenceState = {
  engineVersion: GlobalMarketIntelligenceVersion;
  missionId: "X4-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalMarketIntelligenceConfiguration;
  latestReport: GmiRunReport | null;
  engineRecord: GlobalMarketIntelligenceEngineRecord | null;
  health: GmiHealthReport;
  performance: GmiPerformanceStats;
};

export type GmiCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: MarketValidationReport["decision"] | null;
  totalMarketRecords: number;
  emergingCount: number;
  decliningCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type GmiLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectGlobalMarketIntelligenceInput = Record<string, unknown>;

export type MarketAnalysisInput = {
  country?: string;
  region?: string;
  marketCategory?: MarketCategory;
  demandHint?: number;
  competitionHint?: number;
  opportunityHint?: number;
  emergingHint?: boolean;
  decliningHint?: boolean;
  validated?: boolean;
};

export type RunGmiDiagnosticsInput = {
  country?: string;
  region?: string;
};
