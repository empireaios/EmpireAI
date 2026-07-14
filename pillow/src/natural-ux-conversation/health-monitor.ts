/** T4-01 — Natural UX Conversation health monitoring. */

import type { NaturalUxConversationConfiguration } from "./configuration.js";
import type {
  ConversationDecision,
  ConversationHealthReport,
  ConversationPerformanceStats,
  EngineStatus,
} from "./types.js";

export class HealthMonitor {
  private lastConversationAt: string | null = null;
  private lastDecision: ConversationDecision | null = null;

  recordConversation(success: boolean, decision: ConversationDecision): void {
    this.lastConversationAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: NaturalUxConversationConfiguration;
    status: EngineStatus;
    performance: ConversationPerformanceStats;
    conversationsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): ConversationHealthReport {
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
    if (!input.config.enabled) notes.push("Natural UX conversation disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive conversation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.activeSessions > 0) notes.push(`${input.activeSessions} active session(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      conversationEnabled: input.config.enabled,
      conversationsCompleted: input.conversationsCompleted,
      lastConversationAt: this.lastConversationAt,
      lastConversationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
