/** R2-04 — 1688 connector health monitoring. */

import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type {
  Oss1688ConnectorRecord,
  Oss1688HealthReport,
  Oss1688ValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: Oss1688ValidationReport["decision"] | null = null;

  recordOperation(decision: Oss1688ValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: Oss1688IntegrationConfiguration;
    record: Oss1688ConnectorRecord | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): Oss1688HealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("1688 connector disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.record) {
      notes.push(
        `Auth: ${input.record.authenticationStatus} · Connection: ${input.record.connectionStatus}`,
      );
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      connectorEnabled: input.config.enabled,
      authenticationStatus: input.record?.authenticationStatus ?? "unauthenticated",
      connectionStatus: input.record?.connectionStatus ?? "disconnected",
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
