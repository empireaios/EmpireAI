/** PILLOW-VFC-001 — Visual Foundation Certification types (T1-10). */

import type {
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  T1_MISSION_IDS,
} from "./paths.js";
import type { VisualFoundationCertificationConfiguration } from "./configuration.js";

export type VisualFoundationCertificationEngineVersion = "PILLOW-VFC-001";
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type T1MissionId = (typeof T1_MISSION_IDS)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];

export type MissionValidationResult = {
  missionId: T1MissionId;
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

export type DataSafetySummary = {
  sensitiveMaskingActive: boolean;
  missionsWithMasking: string[];
  warnings: string[];
};

export type VisualFoundationCertificationReport = {
  certificationReportId: string;
  certificationTimestamp: string;
  t1CertificationStatus: CertificationStatus;
  validatedMissionList: T1MissionId[];
  missionResults: MissionValidationResult[];
  endToEndValidationResult: E2eValidationResult;
  errors: string[];
  warnings: string[];
  recoveryResults: RecoveryResult[];
  performanceSummary: PerformanceSummary;
  dataSafetySummary: DataSafetySummary;
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

export type VisualFoundationCertificationState = {
  engineVersion: VisualFoundationCertificationEngineVersion;
  missionId: "T1-10";
  status: CertificationStatus;
  initializedAt: string;
  configuration: VisualFoundationCertificationConfiguration;
  latestReport: VisualFoundationCertificationReport | null;
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
