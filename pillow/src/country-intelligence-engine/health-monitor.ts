/** X4-02 — Country Intelligence Engine health monitoring. */

import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  CountryIntelligenceEngineRecord,
  CountryValidationReport,
  CieHealthReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CountryValidationReport["decision"] | null = null;

  recordOperation(decision: CountryValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CountryIntelligenceEngineConfiguration;
    record: CountryIntelligenceEngineRecord | null;
    totalCountryRecords: number;
    highPriorityCount: number;
    averageCompositeScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CieHealthReport {
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
    if (!input.config.enabled) notes.push("Country Intelligence Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Countries: ${input.totalCountryRecords} · high/critical: ${input.highPriorityCount} · avg composite: ${input.averageCompositeScore}`,
    );
    notes.push("Structural country signals only — no live external economic APIs");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCountryRecords: input.totalCountryRecords,
      highPriorityCount: input.highPriorityCount,
      averageCompositeScore: input.averageCompositeScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
