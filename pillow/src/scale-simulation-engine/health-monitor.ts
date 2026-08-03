/** X3-18 — Scale Simulation Engine health monitoring. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ScaleSimulationEngineRecord,
  SimulationValidationReport,
  SsiHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SimulationValidationReport["decision"] | null = null;

  recordOperation(decision: SimulationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: ScaleSimulationEngineConfiguration;
    record: ScaleSimulationEngineRecord | null;
    totalSimulationRecords: number;
    highScoreCount: number;
    averageSimulationScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SsiHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Scale Simulation Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Simulation records: ${input.totalSimulationRecords} · high score: ${input.highScoreCount} · avg score: ${input.averageSimulationScore}%`,
    );
    notes.push(
      "Never execute simulated actions against production — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalSimulationRecords: input.totalSimulationRecords,
      highScoreCount: input.highScoreCount,
      averageSimulationScore: input.averageSimulationScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
