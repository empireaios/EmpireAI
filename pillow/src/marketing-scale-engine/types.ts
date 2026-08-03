/** PILLOW-MSE-001 — Marketing Scale Engine types (X3-05). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MARKETING_CHANNELS,
  MSE_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketingScaleEngineConfiguration } from "./configuration.js";

export type MarketingScaleEngineVersion = "PILLOW-MSE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type MseCapability = (typeof MSE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export type MarketingScalingRecord = {
  marketingScalingId: string;
  timestamp: string;
  companyReference: string;
  campaignReference: string;
  customerAcquisitionCost: number;
  returnOnAdvertisingSpend: number;
  conversionPerformance: number;
  scalingReadinessScore: number;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  neverRecommendMarketingExpansionWithoutValidatedPerformance: true;
  structuralSignalOnly: true;
  sensitiveMarketingData: false;
};

export type MarketingScaleEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: MseCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    autonomousScalingFramework: boolean;
    winningProductDetector: boolean;
    scalingDecisionEngine: boolean;
    capacityPlanningEngine: boolean;
  };
  metadataVersion: string;
};

export type MarketingRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  campaignReference: string;
  channel?: MarketingChannel;
  recommendationSummary: string;
  scalingReadinessScore: number;
  customerAcquisitionCost: number;
  returnOnAdvertisingSpend: number;
  structuralSignalOnly: true;
  neverRecommendMarketingExpansionWithoutValidatedPerformance: true;
};

export type MarketingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MseRunReport = {
  marketingScaleRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "monitor_performance"
    | "monitor_campaign_scalability"
    | "monitor_cac"
    | "monitor_roas"
    | "monitor_conversion"
    | "monitor_channel"
    | "detect_scalable_campaigns"
    | "detect_bottlenecks"
    | "recommend_scaling"
    | "diagnostics";
  engineRecord: MarketingScaleEngineRecord;
  scalingRecords: MarketingScalingRecord[];
  recommendations: MarketingRecommendation[];
  validation: MarketingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type MseHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: MarketingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  notes: string[];
};

export type MsePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  monitoringRuns: number;
  scalableCampaignsDetected: number;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type MarketingScaleEngineState = {
  engineVersion: MarketingScaleEngineVersion;
  missionId: "X3-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketingScaleEngineConfiguration;
  latestReport: MseRunReport | null;
  engineRecord: MarketingScaleEngineRecord | null;
  health: MseHealthReport;
  performance: MsePerformanceStats;
};

export type MseCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: MarketingValidationReport["decision"] | null;
  totalScalingRecords: number;
  bottleneckCount: number;
  averageReadiness: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type MseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectMarketingScaleEngineInput = Record<string, unknown>;

export type MarketingScaleInput = {
  companyReference?: string;
  campaignReference?: string;
  channel?: MarketingChannel;
  cacHint?: number;
  roasHint?: number;
  conversionHint?: number;
  readinessHint?: number;
  validated?: boolean;
};

export type RunMseDiagnosticsInput = Record<string, unknown>;
