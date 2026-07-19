/** PILLOW-SRE-001 — Supplier Ranking Engine types (R2-08). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierRankingEngineConfiguration } from "./configuration.js";

export type SupplierRankingEngineVersion = "PILLOW-SRE-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];

export type SupplierRankingRecord = {
  rankingRecordId: string;
  supplierId: string;
  overallSupplierScore: number;
  qualityScore: number;
  pricingScore: number;
  inventoryReliabilityScore: number;
  fulfilmentReliabilityScore: number;
  responsivenessScore: number;
  rankingPosition: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type SupplierMetricsSnapshot = {
  supplierId: string;
  productCount: number;
  activeProductCount: number;
  inStockCount: number;
  outOfStockCount: number;
  averagePrice: number;
  priceAnomalyCount: number;
  priceStabilityScore: number;
  responseTimeMs: number;
};

export type PerformanceFinding = {
  findingId: string;
  findingType: "declining" | "high_performing" | "stable";
  supplierId: string;
  rankingRecordId: string;
  previousOverallScore: number | null;
  currentOverallScore: number;
  scoreDelta: number;
  details: string;
};

export type InvalidRankingFinding = {
  supplierId: string;
  errors: string[];
};

export type SupplierRankingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierRankingReport = {
  rankingReportId: string;
  rankingTimestamp: string;
  action: "rank" | "evaluate" | "compare" | "validate";
  rankings: SupplierRankingRecord[];
  findings: PerformanceFinding[];
  invalidRecords: InvalidRankingFinding[];
  validation: SupplierRankingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierRankingHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  rankingCount: number;
  lastRankingAt: string | null;
  lastValidationDecision: SupplierRankingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  rankingFailures: number;
  highPerformersDetected: number;
  decliningPerformersDetected: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type SupplierRankingPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  rankingRuns: number;
  suppliersRanked: number;
  highPerformersDetected: number;
  decliningPerformersDetected: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type SupplierRankingLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierRankingEngineState = {
  engineVersion: SupplierRankingEngineVersion;
  missionId: "R2-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierRankingEngineConfiguration;
  latestReport: SupplierRankingReport | null;
  rankings: SupplierRankingRecord[];
  health: SupplierRankingHealthReport;
  performance: SupplierRankingPerformanceStats;
};

export type SupplierRankingCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  rankingCount: number;
  lastRankingAt: string | null;
  lastDecision: SupplierRankingValidationReport["decision"] | null;
  highPerformersDetected: number;
  decliningPerformersDetected: number;
  topSupplierId: string | null;
  recentLogs: string[];
};

export type RankSuppliersInput = {
  supplierId?: SupportedSupplierIdentifier;
  includeFixtureMetrics?: boolean;
  performanceFixtureMode?: "none" | "declining" | "high_performing";
};

export type EvaluateSupplierInput = {
  supplierId: SupportedSupplierIdentifier;
};
