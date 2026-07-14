/** T3-09 — Change Documentation health monitoring. */

import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type {
  ChangeDocumentationPerformanceStats,
  DocumentationDecision,
  EngineStatus,
  ChangeDocumentationHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastDocumentationAt: string | null = null;
  private lastDecision: DocumentationDecision | null = null;

  recordDocumentation(success: boolean, decision: DocumentationDecision): void {
    this.lastDocumentationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: ChangeDocumentationConfiguration;
    status: EngineStatus;
    performance: ChangeDocumentationPerformanceStats;
    documentationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ChangeDocumentationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Change documentation disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive documentation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.performance.totalRecordsDocumented > 0) {
      notes.push(`${input.performance.totalRecordsDocumented} records documented total`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      documentationEnabled: input.config.enabled,
      documentationsCompleted: input.documentationsCompleted,
      lastDocumentationAt: this.lastDocumentationAt,
      lastDocumentationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      recordsDocumentedTotal: input.performance.totalRecordsDocumented,
      notes,
    };
  }
}
