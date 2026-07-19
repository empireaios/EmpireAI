/** R2-08 — Supplier ranking health monitoring. */

import type { SupplierRankingEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidRankingFinding,
  PerformanceFinding,
  SupplierRankingHealthReport,
  SupplierRankingRecord,
  SupplierRankingValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierRankingValidationReport["decision"] | null = null;
  private rankingFailures = 0;
  private highPerformersDetected = 0;
  private decliningPerformersDetected = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: SupplierRankingValidationReport["decision"],
    findings: PerformanceFinding[] = [],
    invalidRecords: InvalidRankingFinding[] = [],
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.rankingFailures += 1;
    this.highPerformersDetected += findings.filter((f) => f.findingType === "high_performing").length;
    this.decliningPerformersDetected += findings.filter((f) => f.findingType === "declining").length;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: SupplierRankingEngineConfiguration;
    rankings: SupplierRankingRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierRankingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.rankingFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Supplier ranking engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive ranking failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Ranking records: ${input.rankings.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      rankingCount: input.rankings.length,
      lastRankingAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      rankingFailures: this.rankingFailures,
      highPerformersDetected: this.highPerformersDetected,
      decliningPerformersDetected: this.decliningPerformersDetected,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.rankingFailures = 0;
    this.highPerformersDetected = 0;
    this.decliningPerformersDetected = 0;
    this.invalidRecordsDetected = 0;
  }
}
