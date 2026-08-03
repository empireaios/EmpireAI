/** X4-08 — International Logistics Engine health monitoring. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  IleHealthReport,
  InternationalLogisticsEngineRecord,
  LogisticsValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LogisticsValidationReport["decision"] | null = null;

  recordOperation(decision: LogisticsValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: InternationalLogisticsEngineConfiguration;
    record: InternationalLogisticsEngineRecord | null;
    totalLogisticsRecords: number;
    bottleneckCount: number;
    fulfillmentRiskCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): IleHealthReport {
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
    if (!input.config.enabled) notes.push("International Logistics Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalLogisticsRecords} · bottlenecks: ${input.bottleneckCount} · fulfillment risks: ${input.fulfillmentRiskCount}`,
    );
    notes.push("Never recommend shipping using unvalidated logistics data");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalLogisticsRecords: input.totalLogisticsRecords,
      bottleneckCount: input.bottleneckCount,
      fulfillmentRiskCount: input.fulfillmentRiskCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
