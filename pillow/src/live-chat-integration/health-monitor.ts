/** R4-07 — Live chat health monitor. */

import type { LiveChatIntegrationConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  LiveChatEngineRecord,
  LiveChatHealthReport,
  LiveChatValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LiveChatValidationReport["decision"] | null = null;

  recordOperation(decision: LiveChatValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: LiveChatIntegrationConfiguration;
    record: LiveChatEngineRecord | null;
    totalLiveChatRecords: number;
    waitingSessions: number;
    activeSessions: number;
    failedSessions: number;
    queuedMessages: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LiveChatHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedSessions > 0) healthScore -= Math.min(20, input.failedSessions * 5);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Live chat integration disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalLiveChatRecords} live chat session(s)`);
    notes.push(`${input.waitingSessions} waiting · ${input.activeSessions} active`);
    notes.push(`${input.queuedMessages} queued message(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalLiveChatRecords: input.totalLiveChatRecords,
      waitingSessions: input.waitingSessions,
      activeSessions: input.activeSessions,
      failedSessions: input.failedSessions,
      queuedMessages: input.queuedMessages,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
