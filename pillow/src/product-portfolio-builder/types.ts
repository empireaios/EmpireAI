/** PILLOW-PPB-001 — Product Portfolio Builder types (X1-08). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  PPB_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ProductPortfolioBuilderConfiguration } from "./configuration.js";

export type ProductPortfolioBuilderVersion = "PILLOW-PPB-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PpbCapability = (typeof PPB_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ProductPortfolioEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PpbCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessOpportunityDiscovery: boolean;
    marketValidationEngine: boolean;
    businessModelGenerator: boolean;
    storeGenerationEngine: boolean;
  };
  metadataVersion: string;
};

export type ProductPortfolioRecord = {
  portfolioId: string;
  timestamp: string;
  companyReference: string;
  businessModelReference: string;
  productReferences: string;
  productCategories: string;
  rankingSummary: string;
  overlappingProductsSummary: string;
  recommendations: string;
  portfolioProfitabilityScore: number;
  portfolioDemandScore: number;
  portfolioFingerprint: string;
  structuralSignalOnly: true;
  automaticPublication: false;
  fabricatedPortfolioFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ProductPortfolioValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductPortfolioRunReport = {
  portfolioRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "build_portfolio"
    | "discover_products"
    | "evaluate_products"
    | "categorize_products"
    | "rank_products"
    | "estimate_profitability"
    | "estimate_demand"
    | "detect_overlapping_products"
    | "optimize_portfolio"
    | "recommend_improvements";
  engineRecord: ProductPortfolioEngineRecord;
  portfolioRecords: ProductPortfolioRecord[];
  validation: ProductPortfolioValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProductPortfolioHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ProductPortfolioValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPortfolioRecords: number;
  notes: string[];
};

export type ProductPortfolioPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  portfoliosBuilt: number;
  discoveryRuns: number;
  evaluationRuns: number;
  optimizationRuns: number;
  recommendationRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ProductPortfolioLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ProductPortfolioBuilderState = {
  engineVersion: ProductPortfolioBuilderVersion;
  missionId: "X1-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductPortfolioBuilderConfiguration;
  latestReport: ProductPortfolioRunReport | null;
  engineRecord: ProductPortfolioEngineRecord | null;
  health: ProductPortfolioHealthReport;
  performance: ProductPortfolioPerformanceStats;
};

export type ProductPortfolioCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: ProductPortfolioValidationReport["decision"] | null;
  totalPortfolioRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectProductPortfolioBuilderInput = {
  forceReconnect?: boolean;
};

export type BuildPortfolioInput = {
  companyReference?: string;
  businessModelReference?: string;
  industry?: string;
  validated?: boolean;
};

export type PortfolioActionInput = {
  portfolioId?: string;
  companyReference?: string;
  businessModelReference?: string;
  industry?: string;
  validated?: boolean;
};
