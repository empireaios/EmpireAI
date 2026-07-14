/** PILLOW-EXC-001 — Executive Collaboration Certification types (T4-10). */

import type {
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  T4_MISSION_IDS,
} from "./paths.js";
import type { ExecutiveCollaborationCertificationConfiguration } from "./configuration.js";

export type ExecutiveCollaborationCertificationEngineVersion = "PILLOW-EXC-001";
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];
export type T4MissionId = (typeof T4_MISSION_IDS)[number];
export type CertificationDecision = (typeof CERTIFICATION_DECISIONS)[number];

export type MissionValidationResult = {
  missionId: T4MissionId;
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

export type GovernanceSummary = {
  grandKingAuthorityPreserved: boolean;
  approvalRequiredBeforeUxChanges: boolean;
  noAutomaticApprovals: boolean;
  noAutomaticUxExecution: boolean;
  traceabilityPreserved: boolean;
  collaborationTransparencyVerified: boolean;
  warnings: string[];
};

export type ExecutiveCollaborationCertificationReport = {
  certificationReportId: string;
  certificationTimestamp: string;
  t4CertificationStatus: CertificationStatus;
  validatedMissionList: T4MissionId[];
  missionResults: MissionValidationResult[];
  endToEndValidationResult: E2eValidationResult;
  errors: string[];
  warnings: string[];
  recoveryResults: RecoveryResult[];
  performanceSummary: PerformanceSummary;
  governanceSummary: GovernanceSummary;
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

export type ExecutiveCollaborationCertificationState = {
  engineVersion: ExecutiveCollaborationCertificationEngineVersion;
  missionId: "T4-10";
  status: CertificationStatus;
  initializedAt: string;
  configuration: ExecutiveCollaborationCertificationConfiguration;
  latestReport: ExecutiveCollaborationCertificationReport | null;
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
