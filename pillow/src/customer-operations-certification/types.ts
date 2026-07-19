/** PILLOW-COC-001 — Customer Operations Certification types (R4-19). */

import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";
import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";

export type CustomerOperationsCertificationEngineVersion = "PILLOW-COC-001";
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

export type CustomerOperationsCertificationReport = {
  certificationId: string;
  timestamp: string;
  certifiedPhase: string;
  certifiedCustomerModules: string[];
  certifiedCrmStatus: CertificationStatus;
  certifiedCommunicationStatus: CertificationStatus;
  certifiedSupportStatus: CertificationStatus;
  certifiedAnalyticsStatus: CertificationStatus;
  certifiedCustomerIntelligenceStatus: CertificationStatus;
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

export type CustomerOperationsCertificationHealthReport = {
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

export type CustomerOperationsCertificationPerformanceStats = {
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

export type CustomerOperationsCertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CustomerOperationsCertificationState = {
  engineVersion: CustomerOperationsCertificationEngineVersion;
  missionId: "R4-19";
  status: EngineStatus;
  initializedAt: string;
  configuration: CustomerOperationsCertificationConfiguration;
  latestReport: CustomerOperationsCertificationReport | null;
  health: CustomerOperationsCertificationHealthReport;
  performance: CustomerOperationsCertificationPerformanceStats;
};

export type CustomerOperationsCertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  missionsCertified: number;
  overallCertificationStatus: CertificationStatus | null;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunCustomerOperationsCertificationInput = {
  missionScope?: string[];
  includeSmokeTests?: boolean;
};
