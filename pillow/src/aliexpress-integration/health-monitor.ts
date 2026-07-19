/** R2-03 — AliExpress connector health monitoring. */

import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type {
  AliExpressConnectorRecord,
  AliExpressHealthReport,
  AliExpressValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: AliExpressValidationReport["decision"] | null = null;

  recordOperation(decision: AliExpressValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: AliExpressIntegrationConfiguration;
    record: AliExpressConnectorRecord | null;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): AliExpressHealthReport {
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
    if (!input.config.enabled) notes.push("AliExpress connector disabled by configuration");
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
