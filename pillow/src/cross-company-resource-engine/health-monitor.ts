/** X2-11 — Cross-company resource health monitoring. */

import type { CrossCompanyResourceEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  ResourceEngineRecord,
  ResourceHealthReport,
  ResourceValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ResourceValidationReport["decision"] | null = null;

  recordOperation(decision: ResourceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CrossCompanyResourceEngineConfiguration;
    record: ResourceEngineRecord | null;
    totalResourceRecords: number;
    idleResources: number;
    conflictCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ResourceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.conflictCount > 0) healthScore -= Math.min(25, input.conflictCount * 10);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.conflictCount > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Cross-Company Resource Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Resources: ${input.totalResourceRecords} · idle: ${input.idleResources} · conflicts: ${input.conflictCount}`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalResourceRecords: input.totalResourceRecords,
      idleResources: input.idleResources,
      conflictCount: input.conflictCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
