/**
 * G6-08 — Executive incident score engine.
 */

import type { FailureCertificationFinding, FailureRecoveryResultState } from "../contracts/failure-recovery-incident-types.js";

const STATUS_SCORES: Record<FailureRecoveryResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scoreFailureRecoveryStatus(status: FailureRecoveryResultState): number {
  return STATUS_SCORES[status];
}

export function deriveFailureRecoveryStatus(input: {
  blockers: FailureCertificationFinding[];
  warnings: FailureCertificationFinding[];
  pillowBlocked: boolean;
}): FailureRecoveryResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.blockers.some((b) => b.severity === "critical")) return "fail";
  if (input.blockers.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "pass_with_conditions";
  return "pass";
}

export function computeExecutiveIncidentScore(input: {
  blockers: FailureCertificationFinding[];
  warnings: FailureCertificationFinding[];
  pathsReady: number;
  pathsTotal: number;
}): number {
  const status = deriveFailureRecoveryStatus({
    blockers: input.blockers,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scoreFailureRecoveryStatus(status);
  if (input.pathsTotal > 0) {
    const ratio = input.pathsReady / input.pathsTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
