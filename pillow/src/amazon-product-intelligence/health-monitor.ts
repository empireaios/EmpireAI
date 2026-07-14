/** R1-03 — Amazon product intelligence health monitoring. */

import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type {
  AmazonProductHealthReport,
  AmazonProductRecord,
  AmazonProductValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AmazonProductValidationReport["decision"] | null = null;
  private syncFailures = 0;

  recordOperation(decision: AmazonProductValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.syncFailures += 1;
  }

  buildReport(input: {
    config: AmazonProductIntelligenceConfiguration;
    catalog: AmazonProductRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AmazonProductHealthReport {
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
    if (!input.config.enabled) notes.push("Amazon product intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive sync failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Catalog size: ${input.catalog.length} products`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      catalogSize: input.catalog.length,
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
