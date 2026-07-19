/** PILLOW-MHM-001 — Marketplace Health Monitor types (R1-14). */

import type {
  API_AVAILABILITY_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";

export type MarketplaceHealthMonitorEngineVersion = "PILLOW-MHM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ApiAvailabilityStatus = (typeof API_AVAILABILITY_STATUSES)[number];
export type SupportedMarketplaceIdentifier = (typeof SUPPORTED_MARKETPLACE_IDENTIFIERS)[number];

export type MarketplaceHealthRecord = {
  healthRecordId: string;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorId: string | null;
  authenticationStatus: string;
  apiAvailability: ApiAvailabilityStatus;
  apiLatencyMs: number;
  apiErrorRate: number;
  productSynchronizationStatus: string;
  orderSynchronizationStatus: string;
  rateLimitStatus: string;
  activeAlerts: string[];
  recoveryStatus: string;
  overallHealthStatus: HealthStatus;
  metadataVersion: string;
};

export type HealthAlert = {
  alertId: string;
  marketplaceIdentifier: string;
  severity: "info" | "warn" | "critical";
  message: string;
  timestamp: string;
};

export type FailureFinding = {
  marketplaceIdentifier: string;
  connectorId: string | null;
  failureType: "authentication" | "api" | "rate_limit" | "sync" | "connector";
  message: string;
};

export type HealthValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MarketplaceHealthCheckReport = {
  healthCheckReportId: string;
  healthCheckTimestamp: string;
  action: "health_check" | "detect_failures" | "validate";
  records: MarketplaceHealthRecord[];
  alerts: HealthAlert[];
  failures: FailureFinding[];
  validation: HealthValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type MarketplaceHealthMonitorHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  monitoredMarketplaces: number;
  lastHealthCheckAt: string | null;
  lastValidationDecision: HealthValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  checkFailures: number;
  alertsActive: number;
  failuresDetected: number;
  notes: string[];
};

export type MarketplaceHealthMonitorPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  healthCheckRuns: number;
  marketplacesMonitored: number;
  failuresDetected: number;
  alertsGenerated: number;
  degradedConnectorsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type MarketplaceHealthLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketplaceHealthMonitorState = {
  engineVersion: MarketplaceHealthMonitorEngineVersion;
  missionId: "R1-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketplaceHealthMonitorConfiguration;
  latestReport: MarketplaceHealthCheckReport | null;
  records: MarketplaceHealthRecord[];
  health: MarketplaceHealthMonitorHealthReport;
  performance: MarketplaceHealthMonitorPerformanceStats;
};

export type MarketplaceHealthCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  monitoredMarketplaces: number;
  lastHealthCheckAt: string | null;
  lastDecision: HealthValidationReport["decision"] | null;
  failuresDetected: number;
  alertsActive: number;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunHealthCheckInput = {
  marketplaceIdentifier?: SupportedMarketplaceIdentifier;
  includeAllMarketplaces?: boolean;
};

export type DetectFailuresInput = {
  records?: MarketplaceHealthRecord[];
};
