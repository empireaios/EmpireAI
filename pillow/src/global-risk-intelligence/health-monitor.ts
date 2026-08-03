/** X4-14 — Global Risk Intelligence health monitoring. */

import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  GlobalRiskIntelligenceEngineRecord,
  RegionalValidationReport,
  RgoHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RegionalValidationReport["decision"] | null = null;

  recordOperation(decision: RegionalValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: GlobalRiskIntelligenceConfiguration;
    record: GlobalRiskIntelligenceEngineRecord | null;
    totalOptimizationRecords: number;
    opportunityCount: number;
    bottleneckCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RgoHealthReport {
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
    if (!input.config.enabled) notes.push("Global Risk Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalOptimizationRecords} · opportunities: ${input.opportunityCount} · bottlenecks: ${input.bottleneckCount}`,
    );
    notes.push("Never optimize using unvalidated regional intelligence");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalOptimizationRecords: input.totalOptimizationRecords,
      opportunityCount: input.opportunityCount,
      bottleneckCount: input.bottleneckCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
