/** PILLOW-ABC-001 — Autonomous Builder Certification types (T3-10). */

import type {
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  T3_MISSION_IDS,
} from "./paths.js";
import type { AutonomousBuilderCertificationConfiguration } from "./configuration.js";

export type AutonomousBuilderCertificationEngineVersion = "PILLOW-ABC-001";
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type T3MissionId = (typeof T3_MISSION_IDS)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];

export type MissionValidationResult = {
  missionId: T3MissionId;
  missionName: string;
  passed: boolean;
  healthStatus: string;
  readinessScore: number;
  details: string[];
  warnings: string[];
  errors: string[];
  durationMs: number;
};

export type E2eValidationStep = {
  step: string;
  passed: boolean;
  details: string;
};

export type E2eValidationResult = {
  passed: boolean;
  steps: E2eValidationStep[];
  durationMs: number;
  summary: string;
};

export type RecoveryResult = {
  subsystem: string;
  attempted: boolean;
  succeeded: boolean;
  details: string;
};

export type PerformanceSummary = {
  totalDurationMs: number;
  missionsValidated: number;
  missionsPassed: number;
  missionsFailed: number;
  averageMissionDurationMs: number;
  endToEndDurationMs: number;
};

export type ProductionSafetySummary = {
  productionSafetyVerified: boolean;
  validationBeforeAcceptance: boolean;
  regressionProtectionEnforced: boolean;
  rollbackCapabilityAvailable: boolean;
  documentationComplete: boolean;
  traceabilityPreserved: boolean;
  warnings: string[];
};

export type AutonomousBuilderCertificationReport = {
  certificationReportId: string;
  certificationTimestamp: string;
  t3CertificationStatus: CertificationStatus;
  validatedMissionList: T3MissionId[];
  missionResults: MissionValidationResult[];
  endToEndValidationResult: E2eValidationResult;
  errors: string[];
  warnings: string[];
  recoveryResults: RecoveryResult[];
  performanceSummary: PerformanceSummary;
  productionSafetySummary: ProductionSafetySummary;
  finalCertificationDecision: CertificationDecision;
  metadataVersion: string;
  reportOutputPath: string | null;
};

export type CertificationHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  certificationEnabled: boolean;
  lastCertificationAt: string | null;
  lastCertificationDecision: CertificationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type CertificationPerformanceStats = {
  totalCertifications: number;
  successfulCertifications: number;
  failedCertifications: number;
  averageCertificationDurationMs: number;
  peakCertificationDurationMs: number;
};

export type CertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AutonomousBuilderCertificationState = {
  engineVersion: AutonomousBuilderCertificationEngineVersion;
  missionId: "T3-10";
  status: CertificationStatus;
  initializedAt: string;
  configuration: AutonomousBuilderCertificationConfiguration;
  latestReport: AutonomousBuilderCertificationReport | null;
  health: CertificationHealthReport;
  performance: CertificationPerformanceStats;
};

export type CertificationCockpitSnapshot = {
  certificationStatus: CertificationStatus;
  healthStatus: string;
  lastDecision: CertificationDecision | null;
  missionsPassed: number;
  missionsFailed: number;
  endToEndPassed: boolean;
  totalCertifications: number;
  recentLogs: string[];
};
