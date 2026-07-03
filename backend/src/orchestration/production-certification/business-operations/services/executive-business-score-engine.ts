/**
 * G6-05 — Executive business score engine.
 */

import type { BusinessFinding, BusinessOperationsResultState } from "../contracts/business-operations-types.js";

const STATUS_SCORES: Record<BusinessOperationsResultState, number> = {
  ready: 100,
  ready_with_conditions: 85,
  warning: 70,
  blocked: 0,
  not_ready: 0,
  unknown: 25,
};

export function scoreBusinessOperationsStatus(status: BusinessOperationsResultState): number {
  return STATUS_SCORES[status];
}

export function deriveBusinessOperationsStatus(input: {
  failures: BusinessFinding[];
  warnings: BusinessFinding[];
  pillowBlocked: boolean;
}): BusinessOperationsResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.failures.some((f) => f.severity === "critical")) return "not_ready";
  if (input.failures.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "ready_with_conditions";
  return "ready";
}

export function computeExecutiveBusinessScore(input: {
  failures: BusinessFinding[];
  warnings: BusinessFinding[];
  dependenciesSatisfied: number;
  dependenciesTotal: number;
}): number {
  const status = deriveBusinessOperationsStatus({
    failures: input.failures,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scoreBusinessOperationsStatus(status);
  if (input.dependenciesTotal > 0) {
    const ratio = input.dependenciesSatisfied / input.dependenciesTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
