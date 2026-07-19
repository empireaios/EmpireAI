/** PILLOW-PC-001 — Profit Calculation Engine types (R3-06). */

import type {
  CALCULATION_SCOPES,
  ENGINE_STATES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  PC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";

export type ProfitCalculationEngineVersion = "PILLOW-PC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type EngineState = (typeof ENGINE_STATES)[number];
export type CalculationScope = (typeof CALCULATION_SCOPES)[number];
export type PcCapability = (typeof PC_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ProfitEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: EngineState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: PcCapability[];
  metadataVersion: string;
  frameworkModuleId: string | null;
  revenueEngineConnected: boolean;
  expenseEngineConnected: boolean;
};

export type ProfitRecord = {
  profitRecordId: string;
  timestamp: string;
  revenueReference: string | null;
  expenseReference: string | null;
  marketplaceReference: string | null;
  supplierReference: string | null;
  productReference: string | null;
  orderReference: string | null;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  profitMargin: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ProfitAggregationSummary = {
  summaryId: string;
  timestamp: string;
  scope: CalculationScope;
  scopeReference: string | null;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  profitMargin: number;
  totalRecords: number;
  byMarketplace: Record<string, { netProfit: number; profitMargin: number; count: number }>;
  bySupplier: Record<string, { netProfit: number; profitMargin: number; count: number }>;
  metadataVersion: string;
};

export type ProfitAnomaly = {
  anomalyId: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
  description: string;
  profitRecordId: string | null;
};

export type ProfitValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProfitCalculationRunReport = {
  profitRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "calculate"
    | "calculate_marketplace"
    | "calculate_supplier"
    | "calculate_product"
    | "calculate_order"
    | "aggregate";
  engineRecord: ProfitEngineRecord;
  profitRecords: ProfitRecord[];
  aggregation: ProfitAggregationSummary | null;
  anomalies: ProfitAnomaly[];
  validation: ProfitValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProfitHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: ProfitValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalProfitRecords: number;
  aggregateNetProfit: number;
  aggregateProfitMargin: number;
  notes: string[];
};

export type ProfitPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  calculationsRun: number;
  marketplaceCalculations: number;
  supplierCalculations: number;
  productCalculations: number;
  orderCalculations: number;
  aggregationsRun: number;
  anomaliesDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ProfitLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ProfitCalculationEngineState = {
  engineVersion: ProfitCalculationEngineVersion;
  missionId: "R3-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProfitCalculationEngineConfiguration;
  latestReport: ProfitCalculationRunReport | null;
  engineRecord: ProfitEngineRecord | null;
  health: ProfitHealthReport;
  performance: ProfitPerformanceStats;
};

export type ProfitCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: EngineState | null;
  lastDecision: ProfitValidationReport["decision"] | null;
  totalProfitRecords: number;
  aggregateNetProfit: number;
  aggregateProfitMargin: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectProfitCalculationEngineInput = {
  forceReconnect?: boolean;
};

export type CalculateProfitInput = {
  currency?: string;
  revenueReference?: string;
  expenseReference?: string;
};

export type CalculateProfitByMarketplaceInput = {
  marketplaceReference: string;
  currency?: string;
};

export type CalculateProfitBySupplierInput = {
  supplierReference: string;
  currency?: string;
};

export type CalculateProfitByProductInput = {
  productReference: string;
  currency?: string;
};

export type CalculateProfitByOrderInput = {
  orderReference: string;
  currency?: string;
};

export type AggregateProfitInput = {
  currency?: string;
  scope?: CalculationScope;
};
