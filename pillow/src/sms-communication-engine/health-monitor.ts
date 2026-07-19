/** R4-05 — SMS health monitor. */

import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  SmsEngineRecord,
  SmsHealthReport,
  SmsValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SmsValidationReport["decision"] | null = null;

  recordOperation(decision: SmsValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SmsCommunicationEngineConfiguration;
    record: SmsEngineRecord | null;
    totalSmsRecords: number;
    queuedSms: number;
    deliveredSms: number;
    failedSms: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SmsHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedSms > 0) healthScore -= Math.min(20, input.failedSms * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("SMS communication engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalSmsRecords} SMS record(s)`);
    notes.push(`${input.deliveredSms} delivered · ${input.queuedSms} queued`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalSmsRecords: input.totalSmsRecords,
      queuedSms: input.queuedSms,
      deliveredSms: input.deliveredSms,
      failedSms: input.failedSms,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
