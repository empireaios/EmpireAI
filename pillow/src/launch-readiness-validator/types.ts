/** PILLOW-LRV-001 — Launch Readiness Validator types (X1-10). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LRV_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LaunchReadinessValidatorConfiguration } from "./configuration.js";

export type LaunchReadinessValidatorVersion = "PILLOW-LRV-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type LrvCapability = (typeof LRV_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type LaunchEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LrvCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessModelGenerator: boolean;
    brandCreationEngine: boolean;
    domainDigitalAssetPlanner: boolean;
    storeGenerationEngine: boolean;
    productPortfolioBuilder: boolean;
    pricingStrategyEngine: boolean;
  };
  metadataVersion: string;
};

export type LaunchReadinessRecord = {
  launchReadinessId: string;
  timestamp: string;
  companyReference: string;
  businessModelReference: string;
  brandReference: string;
  digitalAssetPlanReference: string;
  storefrontReference: string;
  productPortfolioReference: string;
  pricingReference: string;
  readinessScore: number;
  readinessBreakdown: string;
  launchBlockers: string;
  launchRecommendation: string;
  launchCertified: boolean;
  readinessFingerprint: string;
  structuralSignalOnly: true;
  fabricatedLaunchFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LaunchValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LaunchRunReport = {
  launchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "validate_launch_readiness"
    | "validate_business_configuration"
    | "validate_brand_readiness"
    | "validate_digital_asset_readiness"
    | "validate_storefront_readiness"
    | "validate_product_portfolio_readiness"
    | "validate_pricing_readiness"
    | "detect_launch_blockers"
    | "calculate_readiness_score"
    | "generate_launch_recommendations";
  engineRecord: LaunchEngineRecord;
  readinessRecords: LaunchReadinessRecord[];
  validation: LaunchValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LaunchHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LaunchValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalReadinessRecords: number;
  notes: string[];
};

export type LaunchPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  validationsRun: number;
  scoringRuns: number;
  blockerDetectionRuns: number;
  recommendationRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LaunchLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LaunchReadinessValidatorState = {
  engineVersion: LaunchReadinessValidatorVersion;
  missionId: "X1-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: LaunchReadinessValidatorConfiguration;
  latestReport: LaunchRunReport | null;
  engineRecord: LaunchEngineRecord | null;
  health: LaunchHealthReport;
  performance: LaunchPerformanceStats;
};

export type LaunchCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LaunchValidationReport["decision"] | null;
  totalReadinessRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectLaunchReadinessValidatorInput = {
  forceReconnect?: boolean;
};

export type ValidateLaunchReadinessInput = {
  companyReference?: string;
  businessModelReference?: string;
  brandReference?: string;
  digitalAssetPlanReference?: string;
  storefrontReference?: string;
  productPortfolioReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};

export type LaunchActionInput = {
  launchReadinessId?: string;
  companyReference?: string;
  businessModelReference?: string;
  brandReference?: string;
  digitalAssetPlanReference?: string;
  storefrontReference?: string;
  productPortfolioReference?: string;
  pricingReference?: string;
  industry?: string;
  validated?: boolean;
};
