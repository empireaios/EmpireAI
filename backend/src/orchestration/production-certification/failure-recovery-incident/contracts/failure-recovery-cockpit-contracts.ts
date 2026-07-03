/**
 * G6-08 — Cockpit Failure & Incident backend contracts.
 */

import type {
  EscalationStatusSummary,
  FailureCertificationFinding,
  FailureRecoveryOverview,
  FailureRecoveryResultState,
  FailureRecoveryScanResult,
  IncidentCertificationEntry,
  RecoveryReadinessSummary,
  RollbackReadinessSummary,
} from "./failure-recovery-incident-types.js";

export const COCKPIT_FAILURE_RECOVERY_VIEW_ID = "cockpit-failure-recovery-incident" as const;

export type CockpitFailureRecoveryView = {
  viewId: typeof COCKPIT_FAILURE_RECOVERY_VIEW_ID;
  computedAt: string;
  dataMode: "live";
  failureIncidentOverview: FailureRecoveryOverview;
  recoveryReadiness: RecoveryReadinessSummary;
  rollbackReadiness: RollbackReadinessSummary;
  incidentRegister: IncidentCertificationEntry[];
  escalationStatus: EscalationStatusSummary;
  riskRegister: FailureRecoveryScanResult["riskRegister"];
  certificationStatus: FailureRecoveryResultState;
  incidentScore: number;
  recommendations: string[];
  blockers: FailureCertificationFinding[];
  lastScan?: Pick<FailureRecoveryScanResult, "scanId" | "status" | "incidentScore" | "scannedAt">;
  discoverySource: "production-certification:failure-recovery-cockpit";
};

export function buildCockpitFailureRecoveryView(input: {
  overview: FailureRecoveryOverview;
  scan?: FailureRecoveryScanResult;
}): CockpitFailureRecoveryView {
  const scan = input.scan;
  return {
    viewId: COCKPIT_FAILURE_RECOVERY_VIEW_ID,
    computedAt: new Date().toISOString(),
    dataMode: "live",
    failureIncidentOverview: input.overview,
    recoveryReadiness: scan?.recoveryReadiness ?? {
      recoveryPathsReady: false,
      rollbackPathsReady: false,
      escalationRoutesReady: false,
    },
    rollbackReadiness: scan?.rollbackReadiness ?? {
      rollbackSafe: false,
      rollbackPathsValidated: false,
    },
    incidentRegister: scan?.incidents ?? [],
    escalationStatus: scan?.escalationStatus ?? {
      escalationRoutesReady: false,
      manualInterventionRequired: true,
    },
    riskRegister: scan?.riskRegister ?? [],
    certificationStatus: scan?.status ?? "warning",
    incidentScore: scan?.incidentScore ?? 0,
    recommendations: scan?.executiveRecommendations ?? [],
    blockers: scan?.blockers ?? [],
    lastScan: scan
      ? { scanId: scan.scanId, status: scan.status, incidentScore: scan.incidentScore, scannedAt: scan.scannedAt }
      : undefined,
    discoverySource: "production-certification:failure-recovery-cockpit",
  };
}
