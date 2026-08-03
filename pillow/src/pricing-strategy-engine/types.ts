/** PILLOW-PSE-001 — Pricing Strategy Engine types (X1-09). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PRICING_MODELS,
  PSE_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PricingStrategyEngineConfiguration } from "./configuration.js";

export type PricingStrategyEngineVersion = "PILLOW-PSE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PseCapability = (typeof PSE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type PricingModel = (typeof PRICING_MODELS)[number];

export type PricingEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PseCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    marketValidationEngine: boolean;
    businessModelGenerator: boolean;
    productPortfolioBuilder: boolean;
  };
  metadataVersion: string;
};

export type PricingRecord = {
  pricingRecordId: string;
  timestamp: string;
  companyReference: string;
  productReference: string;
  pricingModel: PricingModel;
  recommendedSellingPrice: number;
  estimatedProfitMargin: number;
  competitiveScore: number;
  willingnessToPayScore: number;
  pricingConflictsSummary: string;
  unprofitableFlags: string;
  recommendations: string;
  analyticsSummary: string;
  pricingFingerprint: string;
  structuralSignalOnly: true;
  automaticPublication: false;
  fabricatedPricingFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type PricingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PricingRunReport = {
  pricingRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "generate_pricing_strategy"
    | "calculate_selling_price"
    | "calculate_profit_margin"
    | "evaluate_competitor_pricing"
    | "evaluate_willingness_to_pay"
    | "select_pricing_model"
    | "detect_pricing_conflicts"
    | "detect_unprofitable_pricing"
    | "recommend_improvements"
    | "analyze_pricing";
  engineRecord: PricingEngineRecord;
  pricingRecords: PricingRecord[];
  validation: PricingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PricingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: PricingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPricingRecords: number;
  notes: string[];
};

export type PricingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  strategiesGenerated: number;
  priceCalculationRuns: number;
  marginRuns: number;
  competitorAnalysisRuns: number;
  recommendationRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type PricingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PricingStrategyEngineState = {
  engineVersion: PricingStrategyEngineVersion;
  missionId: "X1-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: PricingStrategyEngineConfiguration;
  latestReport: PricingRunReport | null;
  engineRecord: PricingEngineRecord | null;
  health: PricingHealthReport;
  performance: PricingPerformanceStats;
};

export type PricingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: PricingValidationReport["decision"] | null;
  totalPricingRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPricingStrategyEngineInput = {
  forceReconnect?: boolean;
};

export type GeneratePricingStrategyInput = {
  companyReference?: string;
  productReference?: string;
  pricingModel?: PricingModel;
  industry?: string;
  validated?: boolean;
};

export type PricingActionInput = {
  pricingRecordId?: string;
  companyReference?: string;
  productReference?: string;
  pricingModel?: PricingModel;
  industry?: string;
  validated?: boolean;
};
