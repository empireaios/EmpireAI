/** PILLOW-RGO-001 — Regional Growth Optimizer types (X4-14). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPTIMIZATION_CATEGORIES,
  OPTIMIZATION_STATUSES,
  PRIORITY_LEVELS,
  RGO_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { RegionalGrowthOptimizerConfiguration } from "./configuration.js";

export type RegionalGrowthOptimizerVersion = "PILLOW-RGO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type RgoCapability = (typeof RGO_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OptimizationCategory = (typeof OPTIMIZATION_CATEGORIES)[number];
export type OptimizationStatus = (typeof OPTIMIZATION_STATUSES)[number];
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export type RegionalOptimizationRecord = {
  regionalOptimizationId: string;
  timestamp: string;
  companyReference: string;
  region: string;
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
  neverOptimizeUsingUnvalidatedRegionalIntelligence: true;
  unvalidatedOptimizationClaim: "none";
};

export type RegionalGrowthOptimizerEngineRecord = {
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
  engineRecord: RegionalGrowthOptimizerEngineRecord;
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

export type RegionalGrowthOptimizerState = {
  engineVersion: RegionalGrowthOptimizerVersion;
  missionId: "X4-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: RegionalGrowthOptimizerConfiguration;
  latestReport: RgoRunReport | null;
  engineRecord: RegionalGrowthOptimizerEngineRecord | null;
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

export type ConnectRegionalGrowthOptimizerInput = Record<string, unknown>;

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
