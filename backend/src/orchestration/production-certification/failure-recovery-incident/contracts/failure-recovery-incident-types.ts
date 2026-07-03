/**
 * G6-08 — Failure, recovery & incident certification contract types.
 */

import { z } from "zod";
import type { FailureRecoveryResultState } from "../../../../registry/types/certification-registry-types.js";
import { FAILURE_RECOVERY_RESULT_STATES } from "../../../../registry/types/certification-registry-types.js";

export const FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION = "g6-08-v1" as const;

export { FAILURE_RECOVERY_RESULT_STATES };
export type { FailureRecoveryResultState };

export const FAILURE_RECOVERY_EKLS_KINDS = [
  "failure_recovery_scan_completed",
  "incident_detected",
  "incident_classified",
  "recovery_path_validated",
  "rollback_path_validated",
  "escalation_required",
  "failure_recovery_certified",
] as const;

export type FailureRecoveryEklsKind = (typeof FAILURE_RECOVERY_EKLS_KINDS)[number];

export type FailureCertificationFinding = {
  findingId: string;
  ruleId: string;
  ruleKind: string;
  certificationDomain: string;
  serviceId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  message: string;
  recommendation?: string;
};

export type IncidentCertificationEntry = {
  incidentId: string;
  ruleId: string;
  certificationDomain: string;
  classified: boolean;
  signalRef: string;
};

export type RecoveryCertificationEntry = {
  recoveryId: string;
  certificationDomain: string;
  pathReady: boolean;
  pathRef: string;
};

export type RollbackCertificationEntry = {
  rollbackId: string;
  certificationDomain: string;
  pathReady: boolean;
  pathRef: string;
};

export type IncidentRiskEntry = {
  riskId: string;
  ruleId: string;
  certificationDomain: string;
  severity: FailureCertificationFinding["severity"];
  summary: string;
  mitigation?: string;
};

export type RecoveryReadinessSummary = {
  recoveryPathsReady: boolean;
  rollbackPathsReady: boolean;
  escalationRoutesReady: boolean;
};

export type RollbackReadinessSummary = {
  rollbackSafe: boolean;
  rollbackPathsValidated: boolean;
};

export type EscalationStatusSummary = {
  escalationRoutesReady: boolean;
  manualInterventionRequired: boolean;
};

export type FailureRecoveryScanResult = {
  scanId: string;
  correlationId: string;
  status: FailureRecoveryResultState;
  incidentScore: number;
  blockers: FailureCertificationFinding[];
  warnings: FailureCertificationFinding[];
  incidents: IncidentCertificationEntry[];
  recoveryPaths: RecoveryCertificationEntry[];
  rollbackPaths: RollbackCertificationEntry[];
  riskRegister: IncidentRiskEntry[];
  executiveRecommendations: string[];
  recoveryReadiness: RecoveryReadinessSummary;
  rollbackReadiness: RollbackReadinessSummary;
  escalationStatus: EscalationStatusSummary;
  scannedAt: string;
  discoverySource: "REG-CERTIFICATION-FAILURE-RECOVERY";
};

export type FailureRecoveryOverview = {
  frameworkVersion: typeof FAILURE_RECOVERY_INCIDENT_CERTIFICATION_VERSION;
  ruleCount: number;
  certificationDomainCount: number;
  lastScanId?: string;
  lastStatus?: FailureRecoveryResultState;
  generatedAt: string;
};

export const failureRecoveryPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  validatorKind: z.enum(["failure", "incident", "recovery", "rollback", "escalation"]),
  pillowGovernance: z.literal(true),
});

export type FailureRecoveryPluginManifest = z.infer<typeof failureRecoveryPluginManifestSchema>;
