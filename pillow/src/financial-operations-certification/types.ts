/** PILLOW-FOC-001 — Financial Operations Certification types (R3-18). */

import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
} from "./paths.js";
import type { FinancialOperationsCertificationConfiguration } from "./configuration.js";

export type FinancialOperationsCertificationEngineVersion = "PILLOW-FOC-001";
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

export type FinancialOperationsCertificationReport = {
  certificationId: string;
  timestamp: string;
  certifiedPhase: string;
  certifiedFinancialModules: string[];
  certifiedPaymentStatus: CertificationStatus;
  certifiedBankingStatus: CertificationStatus;
  certifiedRevenueStatus: CertificationStatus;
  certifiedExpenseStatus: CertificationStatus;
  certifiedProfitabilityStatus: CertificationStatus;
  certifiedCashFlowStatus: CertificationStatus;
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

export type FinancialOperationsCertificationHealthReport = {
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

export type FinancialOperationsCertificationPerformanceStats = {
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

export type FinancialOperationsCertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FinancialOperationsCertificationState = {
  engineVersion: FinancialOperationsCertificationEngineVersion;
  missionId: "R3-18";
  status: EngineStatus;
  initializedAt: string;
  configuration: FinancialOperationsCertificationConfiguration;
  latestReport: FinancialOperationsCertificationReport | null;
  health: FinancialOperationsCertificationHealthReport;
  performance: FinancialOperationsCertificationPerformanceStats;
};

export type FinancialOperationsCertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  missionsCertified: number;
  overallCertificationStatus: CertificationStatus | null;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunFinancialOperationsCertificationInput = {
  missionScope?: string[];
  includeSmokeTests?: boolean;
};
