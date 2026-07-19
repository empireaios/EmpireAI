/** PILLOW-LO-001 — Logistics Optimization types (R2-17). */

import type {
  BOTTLENECK_TYPES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  IMPROVEMENT_TYPES,
  SHIPPING_ROUTES,
  SUPPORTED_CARRIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";

export type LogisticsOptimizationVersion = "PILLOW-LO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SupportedCarrierIdentifier = (typeof SUPPORTED_CARRIER_IDENTIFIERS)[number];
export type ShippingRoute = (typeof SHIPPING_ROUTES)[number];
export type BottleneckType = (typeof BOTTLENECK_TYPES)[number];
export type ImprovementType = (typeof IMPROVEMENT_TYPES)[number];

export type LogisticsRecord = {
  logisticsRecordId: string;
  timestamp: string;
  orderReference: string;
  shipmentReference: string;
  warehouseReference: string;
  carrierReference: SupportedCarrierIdentifier;
  selectedRoute: ShippingRoute;
  estimatedShippingCost: number;
  estimatedDeliveryTime: number;
  optimizationScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type LogisticsBottleneckFinding = {
  logisticsRecordId: string;
  bottleneckType: BottleneckType;
  details: string;
};

export type LogisticsImprovementRecommendation = {
  recommendationId: string;
  orderReference: string;
  improvementType: ImprovementType;
  details: string;
  estimatedSavings: number;
};

export type LogisticsFailureFinding = {
  logisticsRecordId: string;
  failureType:
    | "missing_shipment"
    | "missing_warehouse"
    | "carrier_failure"
    | "route_calculation_failure"
    | "optimization_failure";
  details: string;
};

export type InvalidLogisticsFinding = {
  orderReference: string;
  errors: string[];
};

export type LogisticsValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LogisticsReport = {
  logisticsReportId: string;
  logisticsTimestamp: string;
  action: "optimize" | "analyze" | "route" | "validate";
  records: LogisticsRecord[];
  bottlenecks: LogisticsBottleneckFinding[];
  recommendations: LogisticsImprovementRecommendation[];
  failures: LogisticsFailureFinding[];
  invalidRecords: InvalidLogisticsFinding[];
  validation: LogisticsValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LogisticsHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  logisticsRecordCount: number;
  lastOptimizeAt: string | null;
  lastValidationDecision: LogisticsValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  optimizationFailures: number;
  bottlenecksDetected: number;
  inefficientRoutesDetected: number;
  recommendationsGenerated: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type LogisticsPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  optimizeRuns: number;
  ordersOptimized: number;
  routesAnalyzed: number;
  carriersSelected: number;
  warehousesOptimized: number;
  costsReduced: number;
  deliveryTimesOptimized: number;
  bottlenecksDetected: number;
  inefficientRoutesDetected: number;
  recommendationsGenerated: number;
  optimizationFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LogisticsLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type LogisticsOptimizationState = {
  engineVersion: LogisticsOptimizationVersion;
  missionId: "R2-17";
  status: EngineStatus;
  initializedAt: string;
  configuration: LogisticsOptimizationConfiguration;
  latestReport: LogisticsReport | null;
  records: LogisticsRecord[];
  health: LogisticsHealthReport;
  performance: LogisticsPerformanceStats;
};

export type LogisticsCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  logisticsRecordCount: number;
  lastOptimizeAt: string | null;
  lastDecision: LogisticsValidationReport["decision"] | null;
  bottlenecksDetected: number;
  recommendationsGenerated: number;
  costsReduced: number;
  recentLogs: string[];
};

export type OptimizeShippingInput = {
  orderReference?: string;
  includeFixtureOrders?: boolean;
  logisticsFixtureMode?: "none" | "optimal" | "bottleneck" | "inefficient" | "high_cost";
};
