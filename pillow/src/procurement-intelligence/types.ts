/** PILLOW-PI-001 — Procurement Intelligence types (R2-19). */

import type {
  ANOMALY_TYPES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  PURCHASE_TIMING_RECOMMENDATIONS,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ProcurementIntelligenceConfiguration } from "./configuration.js";

export type ProcurementIntelligenceVersion = "PILLOW-PI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];
export type PurchaseTimingRecommendation = (typeof PURCHASE_TIMING_RECOMMENDATIONS)[number];
export type AnomalyType = (typeof ANOMALY_TYPES)[number];

export type ProcurementIntelligenceRecord = {
  procurementIntelligenceId: string;
  timestamp: string;
  supplierReference: SupportedSupplierIdentifier | string;
  productReference: string;
  procurementReference: string;
  recommendedSupplier: SupportedSupplierIdentifier | string;
  recommendedPurchaseQuantity: number;
  recommendedPurchaseTiming: PurchaseTimingRecommendation;
  estimatedProcurementCost: number;
  procurementConfidenceScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ProcurementAnomalyFinding = {
  procurementIntelligenceId: string;
  anomalyType: AnomalyType;
  details: string;
};

export type PurchasingRecommendation = {
  recommendationId: string;
  productReference: string;
  recommendedSupplier: string;
  recommendedQuantity: number;
  recommendedTiming: PurchaseTimingRecommendation;
  estimatedSavings: number;
  details: string;
};

export type ProcurementIntelligenceFailureFinding = {
  procurementIntelligenceId: string;
  failureType:
    | "missing_procurement"
    | "missing_supplier"
    | "invalid_metrics"
    | "recommendation_failure"
    | "optimization_failure";
  details: string;
};

export type InvalidProcurementIntelligenceFinding = {
  productReference: string;
  errors: string[];
};

export type ProcurementIntelligenceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProcurementIntelligenceReport = {
  intelligenceReportId: string;
  intelligenceTimestamp: string;
  action: "analyze" | "evaluate" | "recommend" | "validate";
  records: ProcurementIntelligenceRecord[];
  anomalies: ProcurementAnomalyFinding[];
  recommendations: PurchasingRecommendation[];
  failures: ProcurementIntelligenceFailureFinding[];
  invalidRecords: InvalidProcurementIntelligenceFinding[];
  validation: ProcurementIntelligenceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProcurementIntelligenceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  intelligenceRecordCount: number;
  lastAnalyzeAt: string | null;
  lastValidationDecision: ProcurementIntelligenceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  analysisFailures: number;
  anomaliesDetected: number;
  recommendationsGenerated: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type ProcurementIntelligencePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  analyzeRuns: number;
  procurementsAnalyzed: number;
  supplierEvaluations: number;
  recommendationsGenerated: number;
  anomaliesDetected: number;
  costsOptimized: number;
  analysisFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ProcurementIntelligenceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ProcurementIntelligenceState = {
  engineVersion: ProcurementIntelligenceVersion;
  missionId: "R2-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProcurementIntelligenceConfiguration;
  latestReport: ProcurementIntelligenceReport | null;
  records: ProcurementIntelligenceRecord[];
  health: ProcurementIntelligenceHealthReport;
  performance: ProcurementIntelligencePerformanceStats;
};

export type ProcurementIntelligenceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  intelligenceRecordCount: number;
  lastAnalyzeAt: string | null;
  lastDecision: ProcurementIntelligenceValidationReport["decision"] | null;
  anomaliesDetected: number;
  recommendationsGenerated: number;
  costsOptimized: number;
  recentLogs: string[];
};

export type AnalyzeProcurementInput = {
  productReference?: string;
  procurementReference?: string;
  includeFixtureProcurements?: boolean;
  intelligenceFixtureMode?: "none" | "optimal" | "elevated_cost" | "anomaly" | "high_risk";
};
