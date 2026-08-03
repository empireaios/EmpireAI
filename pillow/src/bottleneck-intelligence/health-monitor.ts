/** X3-10 — Bottleneck Intelligence health monitoring. */

import type { BottleneckIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  BottleneckIntelligenceEngineRecord,
  BottleneckValidationReport,
  BniHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BottleneckValidationReport["decision"] | null = null;

  recordOperation(decision: BottleneckValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BottleneckIntelligenceConfiguration;
    record: BottleneckIntelligenceEngineRecord | null;
    totalBottleneckRecords: number;
    highSeverityCount: number;
    averageImpact: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BniHealthReport {
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
    if (!input.config.enabled) notes.push("Bottleneck Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Bottleneck records: ${input.totalBottleneckRecords} · high severity: ${input.highSeverityCount} · avg impact: ${input.averageImpact}%`,
    );
    notes.push(
      "Never generate unsupported bottleneck conclusions — structural signals only",
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBottleneckRecords: input.totalBottleneckRecords,
      highSeverityCount: input.highSeverityCount,
      averageImpact: input.averageImpact,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
