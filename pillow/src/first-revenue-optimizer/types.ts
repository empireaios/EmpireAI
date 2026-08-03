/** PILLOW-FRO-001 — First Revenue Optimizer types (X1-14). */

import type {
  ENGINE_STATUSES,
  FRO_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";

export type FirstRevenueOptimizerVersion = "PILLOW-FRO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type FroCapability = (typeof FRO_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RevenueOptimizerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: FroCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    productPortfolioBuilder: boolean;
    pricingStrategyEngine: boolean;
    growthInitializationEngine: boolean;
    launchMonitoringEngine: boolean;
  };
  metadataVersion: string;
};

export type RevenueOptimizationRecord = {
  revenueOptimizationId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  pricingReference: string;
  growthPlanReference: string;
  monitoringReference: string;
  revenueSummary: string;
  productPerformanceScore: number;
  customerPurchaseSummary: string;
  bottleneckSummary: string;
  underperformingProductsSummary: string;
  productPriorityOptimization: string;
  pricingOptimizationRecommendation: string;
  optimizationRecommendation: string;
  expectedRevenueImprovement: string;
  optimizationFingerprint: string;
  structuralSignalOnly: true;
  modifiedProductionPricingWithoutValidation: false;
  fabricatedRevenueFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RevenueValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RevenueRunReport = {
  revenueRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "optimize_first_revenue"
    | "monitor_first_sales"
    | "analyze_early_revenue"
    | "analyze_product_performance"
    | "analyze_customer_purchasing"
    | "detect_revenue_bottlenecks"
    | "detect_underperforming_products"
    | "optimize_product_priorities"
    | "optimize_pricing_recommendations"
    | "generate_early_revenue_recommendations";
  engineRecord: RevenueOptimizerEngineRecord;
  revenueRecords: RevenueOptimizationRecord[];
  validation: RevenueValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RevenueHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RevenueValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalRevenueRecords: number;
  notes: string[];
};

export type RevenuePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  optimizationsRun: number;
  analysisRuns: number;
  productRuns: number;
  recommendationRuns: number;
  bottleneckRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RevenueLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FirstRevenueOptimizerState = {
  engineVersion: FirstRevenueOptimizerVersion;
  missionId: "X1-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: FirstRevenueOptimizerConfiguration;
  latestReport: RevenueRunReport | null;
  engineRecord: RevenueOptimizerEngineRecord | null;
  health: RevenueHealthReport;
  performance: RevenuePerformanceStats;
};

export type RevenueCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: RevenueValidationReport["decision"] | null;
  totalRevenueRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectFirstRevenueOptimizerInput = {
  forceReconnect?: boolean;
};

export type OptimizeFirstRevenueInput = {
  companyReference?: string;
  productReference?: string;
  pricingReference?: string;
  growthPlanReference?: string;
  monitoringReference?: string;
  industry?: string;
  validated?: boolean;
};

export type RevenueActionInput = {
  revenueOptimizationId?: string;
  companyReference?: string;
  productReference?: string;
  pricingReference?: string;
  growthPlanReference?: string;
  monitoringReference?: string;
  industry?: string;
  validated?: boolean;
};
