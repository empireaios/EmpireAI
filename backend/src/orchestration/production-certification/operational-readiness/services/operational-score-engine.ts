/**
 * G6-04 — Operational score engine.
 */

import type { OperationalReadinessResultState } from "../contracts/operational-readiness-types.js";
import type { OperationalBlocker } from "../contracts/operational-readiness-types.js";

const STATUS_SCORES: Record<OperationalReadinessResultState, number> = {
  ready: 100,
  ready_with_conditions: 85,
  warning: 70,
  blocked: 0,
  not_ready: 0,
  unknown: 25,
};

export function scoreOperationalReadiness(status: OperationalReadinessResultState): number {
  return STATUS_SCORES[status];
}

export function deriveOperationalReadinessStatus(input: {
  blockers: OperationalBlocker[];
  warnings: OperationalBlocker[];
  pillowBlocked: boolean;
}): OperationalReadinessResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.blockers.some((b) => b.severity === "critical")) return "not_ready";
  if (input.blockers.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "ready_with_conditions";
  return "ready";
}

export function computeOperationalScore(input: {
  blockers: OperationalBlocker[];
  warnings: OperationalBlocker[];
  dependenciesSatisfied: number;
  dependenciesTotal: number;
}): number {
  const status = deriveOperationalReadinessStatus({
    blockers: input.blockers,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scoreOperationalReadiness(status);
  if (input.dependenciesTotal > 0) {
    const ratio = input.dependenciesSatisfied / input.dependenciesTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
