/** X2-17 — Company lifecycle health monitoring. */

import type { CompanyLifecycleManagerConfiguration } from "./configuration.js";
import type {
  CompanyLifecycleEngineRecord,
  HealthStatus,
  LifecycleHealthReport,
  LifecycleValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LifecycleValidationReport["decision"] | null = null;

  recordOperation(decision: LifecycleValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CompanyLifecycleManagerConfiguration;
    record: CompanyLifecycleEngineRecord | null;
    totalLifecycleRecords: number;
    pendingTransitions: number;
    averageMaturityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LifecycleHealthReport {
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
    if (!input.config.enabled) notes.push("Company Lifecycle Manager disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Lifecycle records: ${input.totalLifecycleRecords} · pending transitions: ${input.pendingTransitions} · avg maturity: ${input.averageMaturityScore}`,
    );
    notes.push("Automatic lifecycle transitions blocked beyond approval policies");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalLifecycleRecords: input.totalLifecycleRecords,
      pendingTransitions: input.pendingTransitions,
      averageMaturityScore: input.averageMaturityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
