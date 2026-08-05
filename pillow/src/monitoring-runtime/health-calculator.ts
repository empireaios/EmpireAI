import type { HealthStatus } from "./types.js";

export type HealthInputs = {
  availability: number;
  errorCount: number;
  latencyMs: number;
  criticalAlertCount: number;
  /** When true and no probe/heartbeat evidence exists, map score 0 → standby/unknown. */
  hasEvidence: boolean;
};

export type HealthCalculation = {
  healthScore: number;
  status: HealthStatus;
};

/**
 * Deterministic health calculation (same inputs → same health score).
 *
 * Formula:
 * - base = availability (0–100)
 * - subtract min(40, errorCount * 5)
 * - subtract min(20, floor(latencyMs / 100))
 * - subtract min(30, criticalAlertCount * 15)
 * - clamp 0–100
 *
 * Status bands:
 * - >= 80 → healthy
 * - >= 60 → degraded
 * - >= 40 → warning
 * - > 0  → critical (or unavailable when availability is 0)
 * - 0 with no evidence → standby (unknown when explicitly unknown path)
 */
export function calculateHealthScore(inputs: HealthInputs): HealthCalculation {
  const availability = clamp(Math.floor(inputs.availability), 0, 100);
  const errorCount = Math.max(0, Math.floor(inputs.errorCount));
  const latencyMs = Math.max(0, Math.floor(inputs.latencyMs));
  const criticalAlertCount = Math.max(0, Math.floor(inputs.criticalAlertCount));

  let score = availability;
  score -= Math.min(40, errorCount * 5);
  score -= Math.min(20, Math.floor(latencyMs / 100));
  score -= Math.min(30, criticalAlertCount * 15);
  score = clamp(score, 0, 100);

  const status = mapScoreToStatus(score, availability, inputs.hasEvidence);
  return { healthScore: score, status };
}

export function mapScoreToStatus(
  healthScore: number,
  availability: number,
  hasEvidence: boolean,
): HealthStatus {
  if (!hasEvidence) {
    return healthScore === 0 ? "unknown" : "standby";
  }
  if (healthScore >= 80) return "healthy";
  if (healthScore >= 60) return "degraded";
  if (healthScore >= 40) return "warning";
  if (healthScore > 0) {
    return availability === 0 ? "unavailable" : "critical";
  }
  return availability === 0 ? "unavailable" : "critical";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class HealthCalculator {
  calculate(inputs: HealthInputs): HealthCalculation {
    return calculateHealthScore(inputs);
  }
}
