/** R1-14 — Marketplace health monitor operational health. */

import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  MarketplaceHealthMonitorHealthReport,
  MarketplaceHealthRecord,
  HealthValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: HealthValidationReport["decision"] | null = null;
  private checkFailures = 0;
  private failuresDetected = 0;
  private alertsActive = 0;

  recordOperation(
    decision: HealthValidationReport["decision"],
    failures: number,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.checkFailures += 1;
    this.failuresDetected += failures;
  }

  buildReport(input: {
    config: MarketplaceHealthMonitorConfiguration;
    records: MarketplaceHealthRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): MarketplaceHealthMonitorHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.checkFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const failedRecords = input.records.filter((r) => r.overallHealthStatus === "failed").length;
    if (failedRecords > 0) healthScore = Math.min(healthScore, 50);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : failedRecords > 0 || input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Marketplace health monitor disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive check failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Monitoring ${input.records.length} marketplace health record(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      monitoredMarketplaces: input.records.length,
      lastHealthCheckAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      checkFailures: this.checkFailures,
      alertsActive: this.alertsActive,
      failuresDetected: this.failuresDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.checkFailures = 0;
    this.failuresDetected = 0;
    this.alertsActive = 0;
  }
}
