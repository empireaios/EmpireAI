/**
 * G6-09 — Simulation score engine.
 */

import type { ProductionSimulationResultState, SimulationBlocker } from "../contracts/production-simulation-types.js";

const STATUS_SCORES: Record<ProductionSimulationResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
  not_applicable: 50,
  unknown: 0,
};

export function scoreSimulationStatus(status: ProductionSimulationResultState): number {
  return STATUS_SCORES[status];
}

export function deriveSimulationRunStatus(input: {
  blockers: SimulationBlocker[];
  warnings: SimulationBlocker[];
  pillowBlocked: boolean;
}): ProductionSimulationResultState {
  if (input.pillowBlocked) return "blocked";
  if (input.blockers.some((b) => b.severity === "critical")) return "fail";
  if (input.blockers.length > 0) return "warning";
  if (input.warnings.some((w) => w.severity === "high")) return "warning";
  if (input.warnings.length > 0) return "pass_with_conditions";
  return "pass";
}

export function computeSimulationScore(input: {
  blockers: SimulationBlocker[];
  warnings: SimulationBlocker[];
  scenariosPassed: number;
  scenariosTotal: number;
}): number {
  const status = deriveSimulationRunStatus({
    blockers: input.blockers,
    warnings: input.warnings,
    pillowBlocked: false,
  });
  let score = scoreSimulationStatus(status);
  if (input.scenariosTotal > 0) {
    const ratio = input.scenariosPassed / input.scenariosTotal;
    score = Math.round(score * 0.7 + ratio * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, score));
}
