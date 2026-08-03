/** X3-05 — Marketing Scale Engine health monitoring. */

import type { MarketingScaleEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  MarketingScaleEngineRecord,
  MarketingValidationReport,
  MseHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: MarketingValidationReport["decision"] | null = null;

  recordOperation(decision: MarketingValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MarketingScaleEngineConfiguration;
    record: MarketingScaleEngineRecord | null;
    totalScalingRecords: number;
    bottleneckCount: number;
    averageReadiness: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): MseHealthReport {
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
    if (!input.config.enabled) notes.push("Marketing Scale Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Scaling records: ${input.totalScalingRecords} · bottlenecks: ${input.bottleneckCount} · avg readiness: ${input.averageReadiness}%`,
    );
    notes.push(
      "Never recommend marketing expansion without validated performance — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalScalingRecords: input.totalScalingRecords,
      bottleneckCount: input.bottleneckCount,
      averageReadiness: input.averageReadiness,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
