/** PILLOW-SOC-001 — Supplier Operations Certification types (R2-20). */

import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";
import type { SupplierOperationsCertificationConfiguration } from "./configuration.js";

export type SupplierOperationsCertificationEngineVersion = "PILLOW-SOC-001";
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

export type SupplierOperationsCertificationReport = {
  certificationId: string;
  timestamp: string;
  certifiedPhase: string;
  certifiedSupplierModules: string[];
  certifiedProcurementStatus: CertificationStatus;
  certifiedFulfilmentStatus: CertificationStatus;
  certifiedLogisticsStatus: CertificationStatus;
  certifiedWarehouseStatus: CertificationStatus;
  certifiedMissionList: string[];
  missionResults: MissionValidationResult[];
  detectedWarnings: string[];
  detectedFailures: string[];
  endToEndValidationResult: "pass" | "partial" | "fail";
  evidenceReferences: string[];
  recoveryStatus: string;
  overallCertificationStatus: CertificationStatus;
  validation: CertificationValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type SupplierOperationsCertificationHealthReport = {
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

export type SupplierOperationsCertificationPerformanceStats = {
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

export type SupplierOperationsCertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type SupplierOperationsCertificationState = {
  engineVersion: SupplierOperationsCertificationEngineVersion;
  missionId: "R2-20";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierOperationsCertificationConfiguration;
  latestReport: SupplierOperationsCertificationReport | null;
  health: SupplierOperationsCertificationHealthReport;
  performance: SupplierOperationsCertificationPerformanceStats;
};

export type SupplierOperationsCertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  missionsCertified: number;
  overallCertificationStatus: CertificationStatus | null;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunSupplierCertificationInput = {
  missionScope?: string[];
  includeSmokeTests?: boolean;
};
