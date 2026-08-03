/** X4-04 — Language Intelligence health monitoring. */

import type { LanguageIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  LanguageIntelligenceEngineRecord,
  LanguageValidationReport,
  LiHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LanguageValidationReport["decision"] | null = null;

  recordOperation(decision: LanguageValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: LanguageIntelligenceConfiguration;
    record: LanguageIntelligenceEngineRecord | null;
    totalLanguageRecords: number;
    unsupportedCount: number;
    averageQualityScore: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LiHealthReport {
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
    if (!input.config.enabled) notes.push("Language Intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Languages: ${input.totalLanguageRecords} · unsupported: ${input.unsupportedCount} · avg quality: ${input.averageQualityScore}`,
    );
    notes.push("Canonical source content is never overwritten automatically");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalLanguageRecords: input.totalLanguageRecords,
      unsupportedCount: input.unsupportedCount,
      averageQualityScore: input.averageQualityScore,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
