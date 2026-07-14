/** T5-03 — UX Opportunity Discovery health monitoring. */

import type { UxOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  DiscoveryHealthReport,
  EngineStatus,
  OpportunityValidationReport,
  UxOpportunityDiscoveryPerformanceStats,
} from "./types.js";

export class HealthMonitor {
  private lastDiscoveryAt: string | null = null;
  private lastDecision: OpportunityValidationReport["decision"] | null = null;

  recordDiscovery(success: boolean, decision: OpportunityValidationReport["decision"]): void {
    this.lastDiscoveryAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: UxOpportunityDiscoveryConfiguration;
    status: EngineStatus;
    performance: UxOpportunityDiscoveryPerformanceStats;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
    continuousDiscoveryActive: boolean;
  }): DiscoveryHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("UX opportunity discovery disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive discovery failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.continuousDiscoveryActive) notes.push("Continuous innovation active");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      discoveryEnabled: input.config.enabled,
      continuousDiscoveryActive: input.continuousDiscoveryActive,
      lastDiscoveryAt: this.lastDiscoveryAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
