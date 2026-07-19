/** R4-06 — WhatsApp health monitor. */

import type { WhatsAppIntegrationConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  WhatsAppEngineRecord,
  WhatsAppHealthReport,
  WhatsAppValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: WhatsAppValidationReport["decision"] | null = null;

  recordOperation(decision: WhatsAppValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: WhatsAppIntegrationConfiguration;
    record: WhatsAppEngineRecord | null;
    totalWhatsAppRecords: number;
    queuedMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    activeConversations: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): WhatsAppHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedMessages > 0) healthScore -= Math.min(20, input.failedMessages * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("WhatsApp integration disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalWhatsAppRecords} WhatsApp record(s)`);
    notes.push(`${input.deliveredMessages} delivered · ${input.queuedMessages} queued`);
    notes.push(`${input.activeConversations} active conversation(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalWhatsAppRecords: input.totalWhatsAppRecords,
      queuedMessages: input.queuedMessages,
      deliveredMessages: input.deliveredMessages,
      failedMessages: input.failedMessages,
      activeConversations: input.activeConversations,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
