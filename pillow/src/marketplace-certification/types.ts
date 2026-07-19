/** PILLOW-MCT-001 — Marketplace Certification types (R1-15). */

import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";
import type { MarketplaceCertificationConfiguration } from "./configuration.js";

export type MarketplaceCertificationEngineVersion = "PILLOW-MCT-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export type MissionValidationResult = {
  missionId: string;
  missionLabel: string;
  status: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
};

export type CertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type MarketplaceCertificationReport = {
  certificationId: string;
  timestamp: string;
  certifiedPhase: string;
  certifiedMissionList: string[];
  missionResults: MissionValidationResult[];
  connectorValidationStatus: CertificationStatus;
  productNormalizationValidationStatus: CertificationStatus;
  orderNormalizationValidationStatus: CertificationStatus;
  healthMonitoringValidationStatus: CertificationStatus;
  detectedWarnings: string[];
  detectedFailures: string[];
  recoveryStatus: string;
  overallCertificationStatus: CertificationStatus;
  validation: CertificationValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type MarketplaceCertificationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  certificationFailures: number;
  missionsCertified: number;
  notes: string[];
};

export type MarketplaceCertificationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  certificationRuns: number;
  missionsValidated: number;
  missionsPassed: number;
  missionsFailed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type MarketplaceCertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketplaceCertificationState = {
  engineVersion: MarketplaceCertificationEngineVersion;
  missionId: "R1-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketplaceCertificationConfiguration;
  latestReport: MarketplaceCertificationReport | null;
  health: MarketplaceCertificationHealthReport;
  performance: MarketplaceCertificationPerformanceStats;
};

export type MarketplaceCertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  missionsCertified: number;
  overallCertificationStatus: CertificationStatus | null;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunCertificationInput = {
  missionScope?: string[];
  includeSmokeTests?: boolean;
};
