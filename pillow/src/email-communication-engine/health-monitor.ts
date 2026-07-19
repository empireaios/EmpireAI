/** R4-04 — Email health monitor. */

import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type {
  EmailEngineRecord,
  EmailHealthReport,
  EmailValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: EmailValidationReport["decision"] | null = null;

  recordOperation(decision: EmailValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: EmailCommunicationEngineConfiguration;
    record: EmailEngineRecord | null;
    totalEmailRecords: number;
    queuedEmails: number;
    deliveredEmails: number;
    failedEmails: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): EmailHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedEmails > 0) {
      healthScore -= Math.min(20, input.failedEmails * 5);
    }

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Email communication engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalEmailRecords} email record(s)`);
    notes.push(`${input.deliveredEmails} delivered · ${input.queuedEmails} queued`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalEmailRecords: input.totalEmailRecords,
      queuedEmails: input.queuedEmails,
      deliveredEmails: input.deliveredEmails,
      failedEmails: input.failedEmails,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
