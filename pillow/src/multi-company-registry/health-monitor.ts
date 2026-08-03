/** X2-02 — Multi-Company Registry health monitoring. */

import type { MultiCompanyRegistryConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  RegistryEngineRecord,
  RegistryHealthReport,
  RegistryValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: RegistryValidationReport["decision"] | null = null;

  recordOperation(decision: RegistryValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MultiCompanyRegistryConfiguration;
    record: RegistryEngineRecord | null;
    totalCompanyRecords: number;
    activeCompanies: number;
    duplicateSignals: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RegistryHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.duplicateSignals > 0) healthScore -= Math.min(20, input.duplicateSignals * 5);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1 || input.duplicateSignals > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Multi-Company Registry disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Companies: ${input.totalCompanyRecords} registered · ${input.activeCompanies} active`,
    );

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCompanyRecords: input.totalCompanyRecords,
      activeCompanies: input.activeCompanies,
      duplicateSignals: input.duplicateSignals,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
