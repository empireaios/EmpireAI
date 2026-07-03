/**
 * G6-03 — Infrastructure deployment scoring.
 */

import type { InfrastructureDeploymentResultState } from "../contracts/infrastructure-deployment-types.js";

const STATUS_SCORES: Record<InfrastructureDeploymentResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scoreInfrastructureDeploymentStatus(status: InfrastructureDeploymentResultState): number {
  return STATUS_SCORES[status];
}

export function deriveInfrastructureDeploymentStatus(input: {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}): InfrastructureDeploymentResultState {
  if (input.criticalCount > 0) return "fail";
  if (input.highCount > 0) return "warning";
  if (input.mediumCount > 0) return "pass_with_conditions";
  return "pass";
}
