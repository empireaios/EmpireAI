/** R5-17 — Marketing Experiment Engine health monitor. */

import type { MarketingExperimentEngineConfiguration } from "./configuration.js";
import type {
  ExperimentEngineRecord,
  ExperimentHealthReport,
  ExperimentValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExperimentValidationReport["decision"] | null = null;

  recordOperation(decision: ExperimentValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MarketingExperimentEngineConfiguration;
    record: ExperimentEngineRecord | null;
    totalExperimentRecords: number;
    runningExperiments: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExperimentHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Marketing Experiment Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalExperimentRecords} experiment record(s)`);
    notes.push(`${input.runningExperiments} running experiment(s)`);
    notes.push("Winning variant deployment gated by validation");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalExperimentRecords: input.totalExperimentRecords,
      runningExperiments: input.runningExperiments,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
