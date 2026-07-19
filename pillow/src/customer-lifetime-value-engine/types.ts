/** PILLOW-CLVE-001 — Customer Lifetime Value Engine types (R4-15). */

import type {
  CLVE_CAPABILITIES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
  VALUE_TIERS,
} from "./paths.js";
import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";

export type CustomerLifetimeValueEngineVersion = "PILLOW-CLVE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type ValueTier = (typeof VALUE_TIERS)[number];
export type ClveCapability = (typeof CLVE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ClvEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ClveCapability[];
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  timelineEngineConnected: boolean;
  revenueEngineConnected: boolean;
  profitCalculationEngineConnected: boolean;
  loyaltyProgrammeEngineConnected: boolean;
  customerRiskEngineConnected: boolean;
  metadataVersion: string;
};

export type ClvRecord = {
  clvRecordId: string;
  timestamp: string;
  customerId: string;
  revenueContribution: number;
  profitContribution: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  retentionScore: number;
  lifetimeValue: number;
  predictedLifetimeValue: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ClvInsight = {
  insightId: string;
  timestamp: string;
  customerId: string;
  clvRecordId: string;
  insightType: "high_value" | "declining_value" | "prediction";
  valueTier: ValueTier;
  message: string;
  metadataVersion: string;
};

export type ClvFailure = {
  failureId: string;
  timestamp: string;
  clvRecordId: string | null;
  reason: string;
  severity: "low" | "medium" | "high";
  metadataVersion: string;
};

export type ClvValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ClvRunReport = {
  clvRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "calculate_clv"
    | "track_revenue"
    | "track_profitability"
    | "track_retention"
    | "track_purchase_frequency"
    | "track_average_order_value"
    | "predict_future_value"
    | "identify_high_value"
    | "identify_declining_value"
    | "detect_failures"
    | "report_status"
    | "report_health";
  engineRecord: ClvEngineRecord;
  clvRecords: ClvRecord[];
  insights: ClvInsight[];
  failures: ClvFailure[];
  validation: ClvValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ClvHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ClvValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalClvRecords: number;
  highValueCustomers: number;
  decliningValueCustomers: number;
  failedRecords: number;
  notes: string[];
};

export type ClvPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  clvCalculations: number;
  revenueAnalyses: number;
  profitabilityAnalyses: number;
  retentionAnalyses: number;
  purchaseFrequencyTracked: number;
  averageOrderValueTracked: number;
  predictionsGenerated: number;
  highValueIdentified: number;
  decliningValueIdentified: number;
  failuresDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ClvCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ClvValidationReport["decision"] | null;
  totalClvRecords: number;
  highValueCustomers: number;
  decliningValueCustomers: number;
  identityEngineConnected: boolean;
  crmFoundationConnected: boolean;
  revenueEngineConnected: boolean;
  recentLogs: string[];
};

export type ClveLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectClvEngineInput = {
  forceReconnect?: boolean;
};

export type CalculateCustomerLifetimeValueInput = {
  customerId: string;
};

export type TrackCustomerRevenueInput = {
  customerId: string;
};

export type TrackCustomerProfitabilityInput = {
  customerId: string;
};

export type TrackCustomerRetentionInput = {
  customerId: string;
};

export type TrackPurchaseFrequencyInput = {
  customerId: string;
};

export type TrackAverageOrderValueInput = {
  customerId: string;
};

export type PredictFutureCustomerValueInput = {
  customerId: string;
};

export type IdentifyHighValueCustomersInput = {
  customerId?: string;
};

export type IdentifyDecliningCustomerValueInput = {
  customerId?: string;
};

export type DetectClvFailuresInput = {
  clvRecordId?: string;
};

export type CustomerLifetimeValueEngineState = {
  engineVersion: CustomerLifetimeValueEngineVersion;
  missionId: "R4-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerLifetimeValueEngineConfiguration;
  latestReport: ClvRunReport | null;
  engineRecord: ClvEngineRecord | null;
  health: ClvHealthReport;
  performance: ClvPerformanceStats;
};

export type CustomerFinancialSignals = {
  revenueContribution: number;
  profitContribution: number;
  purchaseFrequency: number;
  averageOrderValue: number;
  retentionScore: number;
  timelineEventCount: number;
  loyaltyTier: string | null;
  loyaltyPoints: number;
  riskScore: number;
};
