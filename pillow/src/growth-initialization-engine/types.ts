/** PILLOW-GIE-001 — Growth Initialization Engine types (X1-12). */

import type {
  ENGINE_STATUSES,
  GIE_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GrowthInitializationEngineConfiguration } from "./configuration.js";

export type GrowthInitializationEngineVersion = "PILLOW-GIE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type GieCapability = (typeof GIE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type GrowthEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: GieCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    productPortfolioBuilder: boolean;
    pricingStrategyEngine: boolean;
    businessLaunchOrchestrator: boolean;
  };
  metadataVersion: string;
};

export type GrowthPlanRecord = {
  growthPlanId: string;
  timestamp: string;
  companyReference: string;
  launchReference: string;
  portfolioReference: string;
  pricingReference: string;
  growthObjectives: string;
  revenueMilestones: string;
  customerAcquisitionPlan: string;
  launchMarketingRecommendations: string;
  salesTargets: string;
  operationalPriorities: string;
  performanceBaselines: string;
  earlyPerformanceSummary: string;
  immediateOptimizations: string;
  growthScore: number;
  growthFingerprint: string;
  structuralSignalOnly: true;
  modifiedOperationalConfigWithoutValidation: false;
  fabricatedGrowthFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type GrowthValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type GrowthRunReport = {
  growthRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "initialize_growth_plan"
    | "generate_growth_strategy"
    | "generate_launch_marketing_recommendations"
    | "generate_sales_targets"
    | "generate_operational_priorities"
    | "generate_revenue_milestones"
    | "generate_customer_acquisition_plan"
    | "generate_performance_baselines"
    | "track_early_performance"
    | "recommend_immediate_optimizations";
  engineRecord: GrowthEngineRecord;
  growthRecords: GrowthPlanRecord[];
  validation: GrowthValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GrowthHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: GrowthValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalGrowthRecords: number;
  notes: string[];
};

export type GrowthPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  plansInitialized: number;
  strategyRuns: number;
  milestoneRuns: number;
  acquisitionRuns: number;
  recommendationRuns: number;
  analyticsRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GrowthLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type GrowthInitializationEngineState = {
  engineVersion: GrowthInitializationEngineVersion;
  missionId: "X1-12";
  status: EngineStatus;
  initializedAt: string;
  configuration: GrowthInitializationEngineConfiguration;
  latestReport: GrowthRunReport | null;
  engineRecord: GrowthEngineRecord | null;
  health: GrowthHealthReport;
  performance: GrowthPerformanceStats;
};

export type GrowthCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: GrowthValidationReport["decision"] | null;
  totalGrowthRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectGrowthInitializationEngineInput = {
  forceReconnect?: boolean;
};

export type InitializeGrowthPlanInput = {
  companyReference?: string;
  launchReference?: string;
  portfolioReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};

export type GrowthActionInput = {
  growthPlanId?: string;
  companyReference?: string;
  launchReference?: string;
  portfolioReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};
