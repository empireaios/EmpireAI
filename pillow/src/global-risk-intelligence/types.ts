/** PILLOW-GRI-001 — Global Risk Intelligence types (X4-15). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_STATUSES,
  PRIORITY_LEVELS,
  GRI_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";

export type GlobalRiskIntelligenceVersion = "PILLOW-GRI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RgoCapability = (typeof GRI_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];
export type OptimizationStatus = (typeof OPTIMIZATION_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export type RegionalOptimizationRecord = {
  regionalOptimizationId: string;
  /** X4-15 canonical global-risk record identity. */
  globalRiskId: string;
  timestamp: string;
  companyReference: string;
  country: string;
  region: string;
  riskCategory: string;
  riskSeverity: PriorityLevel;
  businessImpact: string;
  mitigationRecommendation: string;
  revenueScore: number;
  profitabilityScore: number;
  customerGrowthScore: number;
  optimizationPriority: PriorityLevel;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  optimizationCategory: OptimizationCategory;
  optimizationStatus: OptimizationStatus;
  growthOpportunityDetected: boolean;
  bottleneckDetected: boolean;
  optimizationTraceId: string;
  structuralSignalOnly: true;
  neverSuppressCriticalInternationalRisks: true;
  preserveRiskTraceability: true;
  neverOptimizeUsingUnvalidatedRegionalIntelligence: true;
  unvalidatedRiskClaim: "none";
  riskTraceId: string;
  unvalidatedOptimizationClaim: "none";
};

export type GlobalRiskIntelligenceEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RgoCapability[];
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
    globalMarketIntelligence: boolean;
    executiveGlobalDashboard: boolean;
    globalBrandManagement: boolean;
    internationalPartnershipEngine: boolean;
    globalTalentIntelligence: boolean;
  };
  metadataVersion: string;
};

export type RegionalGrowthRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  region: string;
  optimizationCategory: OptimizationCategory;
  optimizationPriority: PriorityLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverOptimizeUsingUnvalidatedRegionalIntelligence: true;
  unvalidatedOptimizationClaim: "none";
};

export type RegionalValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RgoRunReport = {
  regionalRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_regional_business_performance"
    | "monitor_regional_revenue_growth"
    | "monitor_regional_profitability"
    | "monitor_regional_customer_growth"
    | "monitor_regional_operational_efficiency"
    | "detect_regional_growth_opportunities"
    | "detect_regional_performance_bottlenecks"
    | "rank_regional_optimization_priorities"
    | "recommend_regional_growth"
    | "diagnostics";
  engineRecord: GlobalRiskIntelligenceEngineRecord;
  optimizationRecords: RegionalOptimizationRecord[];
  recommendations: RegionalGrowthRecommendation[];
  validation: RegionalValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RgoHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RegionalValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalOptimizationRecords: number;
  opportunityCount: number;
  bottleneckCount: number;
  notes: string[];
};

export type RgoPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  businessPerformanceMonitors: number;
  revenueMonitors: number;
  profitabilityMonitors: number;
  customerGrowthMonitors: number;
  efficiencyMonitors: number;
  opportunityDetections: number;
  bottleneckDetections: number;
  priorityRankings: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GlobalRiskIntelligenceState = {
  engineVersion: GlobalRiskIntelligenceVersion;
  missionId: "X4-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalRiskIntelligenceConfiguration;
  latestReport: RgoRunReport | null;
  engineRecord: GlobalRiskIntelligenceEngineRecord | null;
  health: RgoHealthReport;
  performance: RgoPerformanceStats;
};

export type RgoCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: RegionalValidationReport["decision"] | null;
  totalOptimizationRecords: number;
  opportunityCount: number;
  bottleneckCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type RgoLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectGlobalRiskIntelligenceInput = Record<string, unknown>;

export type RegionalOptimizationInput = {
  companyReference?: string;
  region?: string;
  optimizationCategory?: OptimizationCategory;
  revenueHint?: number;
  profitabilityHint?: number;
  customerGrowthHint?: number;
  efficiencyHint?: number;
  opportunityHint?: boolean;
  bottleneckHint?: boolean;
  validated?: boolean;
};

export type RunRgoDiagnosticsInput = {
  companyReference?: string;
  region?: string;
};
