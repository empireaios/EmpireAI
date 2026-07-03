/**
 * G6-07 — Executive operations score engine.
 */

import type { ExecutiveBlocker, ExecutiveResultState } from "../contracts/executive-operations-types.js";

const STATUS_SCORES: Record<ExecutiveResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
};

export function scoreExecutiveStatus(status: ExecutiveResultState): number {
  return STATUS_SCORES[status];
}

export function deriveExecutiveOperationsStatus(input: {
  blockers: ExecutiveBlocker[];
  warnings: ExecutiveBlocker[];
  pillowBlocked: boolean;
}): ExecutiveResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.blockers.some((b) => b.severity === "critical")) return "fail";
  if (input.blockers.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "pass_with_conditions";
  return "pass";
}

export function computeExecutiveOperationsScore(input: {
  blockers: ExecutiveBlocker[];
  warnings: ExecutiveBlocker[];
  visibilitySatisfied: number;
  visibilityTotal: number;
}): number {
  const status = deriveExecutiveOperationsStatus({
    blockers: input.blockers,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scoreExecutiveStatus(status);
  if (input.visibilityTotal > 0) {
    const ratio = input.visibilitySatisfied / input.visibilityTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
