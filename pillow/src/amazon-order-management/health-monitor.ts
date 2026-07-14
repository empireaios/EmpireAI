/** R1-04 — Amazon order management health monitoring. */

import type { AmazonOrderManagementConfiguration } from "./configuration.js";
import type {
  AmazonOrderHealthReport,
  AmazonOrderRecord,
  AmazonOrderValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AmazonOrderValidationReport["decision"] | null = null;
  private syncFailures = 0;

  recordOperation(decision: AmazonOrderValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.syncFailures += 1;
  }

  buildReport(input: {
    config: AmazonOrderManagementConfiguration;
    orders: AmazonOrderRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AmazonOrderHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.syncFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Amazon order management disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive sync failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Order count: ${input.orders.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      orderCount: input.orders.length,
      lastSyncAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      syncFailures: this.syncFailures,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.syncFailures = 0;
  }
}
