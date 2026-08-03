/** PILLOW-WPD-001 — Winning Product Detector types (X3-02). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPPORTUNITY_CLASSES,
  VALIDATION_STATUSES,
  WPD_CAPABILITIES,
} from "./paths.js";
import type { WinningProductDetectorConfiguration } from "./configuration.js";

export type WinningProductDetectorVersion = "PILLOW-WPD-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type WpdCapability = (typeof WPD_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OpportunityClass = (typeof OPPORTUNITY_CLASSES)[number];

export type ProductOpportunityRecord = {
  productOpportunityId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  salesVelocity: number;
  revenueGrowth: number;
  profitGrowth: number;
  demandScore: number;
  trendScore: number;
  scalingPotentialScore: number;
  opportunityRanking: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  opportunityClass: OpportunityClass;
  neverManipulateProductPerformanceData: true;
  structuralSignalOnly: true;
  sensitiveOperationalData: false;
};

export type WinningProductDetectorEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: WpdCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
  };
  metadataVersion: string;
};

export type ProductRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  recommendationSummary: string;
  scalingPotentialScore: number;
  opportunityClass: OpportunityClass;
  structuralSignalOnly: true;
  neverManipulateProductPerformanceData: true;
};

export type ProductValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WpdRunReport = {
  productRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_performance"
    | "analyze_sales_velocity"
    | "analyze_demand"
    | "analyze_trends"
    | "detect_breakouts"
    | "detect_declining"
    | "rank_products"
    | "generate_recommendations"
    | "diagnostics";
  engineRecord: WinningProductDetectorEngineRecord;
  productRecords: ProductOpportunityRecord[];
  recommendations: ProductRecommendation[];
  validation: ProductValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WpdHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ProductValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalProductRecords: number;
  breakoutCount: number;
  decliningCount: number;
  averageScalingPotential: number;
  notes: string[];
};

export type WpdPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  performanceMonitors: number;
  velocityAnalyses: number;
  demandAnalyses: number;
  trendAnalyses: number;
  breakoutDetections: number;
  decliningDetections: number;
  rankingsRun: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WinningProductDetectorState = {
  engineVersion: WinningProductDetectorVersion;
  missionId: "X3-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: WinningProductDetectorConfiguration;
  latestReport: WpdRunReport | null;
  engineRecord: WinningProductDetectorEngineRecord | null;
  health: WpdHealthReport;
  performance: WpdPerformanceStats;
};

export type WpdCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ProductValidationReport["decision"] | null;
  totalProductRecords: number;
  breakoutCount: number;
  decliningCount: number;
  averageScalingPotential: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type WpdLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectWinningProductDetectorInput = Record<string, unknown>;

export type ProductAnalysisInput = {
  companyReference?: string;
  productReference?: string;
  salesVelocityHint?: number;
  revenueGrowthHint?: number;
  profitGrowthHint?: number;
  demandHint?: number;
  trendHint?: number;
  conversionHint?: number;
  inventoryMovementHint?: number;
  validated?: boolean;
};

export type RunWpdDiagnosticsInput = Record<string, unknown>;
