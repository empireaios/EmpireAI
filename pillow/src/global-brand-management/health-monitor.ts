/** X4-11 — Global Brand Management health monitoring. */

import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import type {
  BrandValidationReport,
  GbmHealthReport,
  GlobalBrandManagementEngineRecord,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BrandValidationReport["decision"] | null = null;

  recordOperation(decision: BrandValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: GlobalBrandManagementConfiguration;
    record: GlobalBrandManagementEngineRecord | null;
    totalBrandRecords: number;
    inconsistencyCount: number;
    reputationRiskCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): GbmHealthReport {
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
    if (!input.config.enabled) notes.push("Global Brand Management disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalBrandRecords} · inconsistencies: ${input.inconsistencyCount} · reputation risks: ${input.reputationRiskCount}`,
    );
    notes.push("Never modify protected brand assets without authorization");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalBrandRecords: input.totalBrandRecords,
      inconsistencyCount: input.inconsistencyCount,
      reputationRiskCount: input.reputationRiskCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
