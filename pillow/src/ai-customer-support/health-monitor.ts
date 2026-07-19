/** R4-08 — AI Customer Support health monitor. */

import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type {
  AiSupportEngineRecord,
  AiSupportHealthReport,
  AiSupportValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AiSupportValidationReport["decision"] | null = null;

  recordOperation(decision: AiSupportValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AiCustomerSupportConfiguration;
    record: AiSupportEngineRecord | null;
    totalAiSupportRecords: number;
    openEnquiries: number;
    escalatedEnquiries: number;
    resolvedEnquiries: number;
    failedEnquiries: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AiSupportHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedEnquiries > 0) healthScore -= Math.min(20, input.failedEnquiries * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("AI customer support disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalAiSupportRecords} AI support record(s)`);
    notes.push(`${input.openEnquiries} open · ${input.escalatedEnquiries} escalated · ${input.resolvedEnquiries} resolved`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalAiSupportRecords: input.totalAiSupportRecords,
      openEnquiries: input.openEnquiries,
      escalatedEnquiries: input.escalatedEnquiries,
      resolvedEnquiries: input.resolvedEnquiries,
      failedEnquiries: input.failedEnquiries,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
