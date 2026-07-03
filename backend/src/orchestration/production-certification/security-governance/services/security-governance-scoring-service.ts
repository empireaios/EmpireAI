/**
 * G6-02 — Security governance scoring.
 */

import type { SecurityGovernanceResultState } from "../contracts/security-governance-types.js";

const STATUS_SCORES: Record<SecurityGovernanceResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scoreSecurityGovernanceStatus(status: SecurityGovernanceResultState): number {
  return STATUS_SCORES[status];
}

export function deriveSecurityGovernanceStatus(input: {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}): SecurityGovernanceResultState {
  if (input.criticalCount > 0) return "fail";
  if (input.highCount > 0) return "warning";
  if (input.mediumCount > 0) return "pass_with_conditions";
  return "pass";
}
