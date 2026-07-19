/** R5-06 — SEO Intelligence health monitor. */

import type { SeoIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  SeoEngineRecord,
  SeoHealthReport,
  SeoValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SeoValidationReport["decision"] | null = null;

  recordOperation(decision: SeoValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SeoIntelligenceConfiguration;
    record: SeoEngineRecord | null;
    totalProjects: number;
    totalPagesAnalyzed: number;
    totalKeywords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SeoHealthReport {
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
    if (!input.config.enabled) notes.push("SEO Intelligence Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalProjects} project(s)`);
    notes.push(`${input.totalPagesAnalyzed} page(s) analyzed`);
    notes.push(`${input.totalKeywords} keyword(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalProjects: input.totalProjects,
      totalPagesAnalyzed: input.totalPagesAnalyzed,
      totalKeywords: input.totalKeywords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
