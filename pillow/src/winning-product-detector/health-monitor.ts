/** X3-02 — Winning Product Detector health monitoring. */

import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ProductValidationReport,
  WinningProductDetectorEngineRecord,
  WpdHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ProductValidationReport["decision"] | null = null;

  recordOperation(decision: ProductValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: WinningProductDetectorConfiguration;
    record: WinningProductDetectorEngineRecord | null;
    totalProductRecords: number;
    breakoutCount: number;
    decliningCount: number;
    averageScalingPotential: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): WpdHealthReport {
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
    if (!input.config.enabled) notes.push("Winning Product Detector disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Products: ${input.totalProductRecords} · breakouts: ${input.breakoutCount} · declining: ${input.decliningCount} · avg potential: ${input.averageScalingPotential}`,
    );
    notes.push("Structural product signals only — performance data is never manipulated");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalProductRecords: input.totalProductRecords,
      breakoutCount: input.breakoutCount,
      decliningCount: input.decliningCount,
      averageScalingPotential: input.averageScalingPotential,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
