/** PILLOW-RWOC-001 — Real World Operations Certification types (R5-20). */

import type {
  CERTIFICATION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  RWOC_CAPABILITIES,
} from "./paths.js";
import type { RealWorldOperationsCertificationConfiguration } from "./configuration.js";

export type RealWorldOperationsCertificationEngineVersion = "PILLOW-RWOC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type RwocCapability = (typeof RWOC_CAPABILITIES)[number];

export type ProgrammeValidationResult = {
  programmeId: string;
  programmeLabel: string;
  status: "pass" | "partial" | "fail";
  certificationStatus: CertificationStatus;
  errors: string[];
  warnings: string[];
  evidenceReferences: string[];
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

export type RealWorldOperationsCertificationReport = {
  certificationId: string;
  timestamp: string;
  marketplaceCertificationStatus: CertificationStatus;
  supplierCertificationStatus: CertificationStatus;
  fulfilmentCertificationStatus: CertificationStatus;
  financialCertificationStatus: CertificationStatus;
  customerCertificationStatus: CertificationStatus;
  marketingCertificationStatus: CertificationStatus;
  endToEndWorkflowResult: "pass" | "partial" | "fail";
  crossProgrammeIntegrationResult: "pass" | "partial" | "fail";
  operationalReadinessScore: number;
  autonomousOperationalReadiness: boolean;
  programmeResults: ProgrammeValidationResult[];
  warnings: string[];
  errors: string[];
  overallCertificationStatus: CertificationStatus;
  evidenceReferences: string[];
  recoveryStatus: string;
  productionMutationAttempted: false;
  validation: CertificationValidationReport;
  durationMs: number;
  schemaVersion: string;
  metadataVersion: string;
};

export type RealWorldOperationsCertificationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  certificationFailures: number;
  programmesCertified: number;
  notes: string[];
};

export type RealWorldOperationsCertificationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  certificationRuns: number;
  programmesValidated: number;
  programmesPassed: number;
  programmesFailed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RealWorldOperationsCertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type RealWorldOperationsCertificationState = {
  engineVersion: RealWorldOperationsCertificationEngineVersion;
  missionId: "R5-20";
  status: EngineStatus;
  initializedAt: string;
  configuration: RealWorldOperationsCertificationConfiguration;
  latestReport: RealWorldOperationsCertificationReport | null;
  health: RealWorldOperationsCertificationHealthReport;
  performance: RealWorldOperationsCertificationPerformanceStats;
};

export type RealWorldOperationsCertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastCertificationAt: string | null;
  lastCertificationStatus: CertificationStatus | null;
  programmesCertified: number;
  operationalReadinessScore: number | null;
  overallCertificationStatus: CertificationStatus | null;
  schemaVersion: string;
  recentLogs: string[];
};

export type RunRealWorldOperationsCertificationInput = {
  programmeScope?: string[];
  validated?: boolean;
};
