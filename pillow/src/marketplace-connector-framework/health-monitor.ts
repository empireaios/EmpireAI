/** R1-01 — Framework health monitoring. */

import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type {
  ConnectorValidationReport,
  FrameworkHealthReport,
  HealthStatus,
  MarketplaceConnectorRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ConnectorValidationReport["decision"] | null = null;

  recordOperation(decision: ConnectorValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: MarketplaceConnectorFrameworkConfiguration;
    connectors: MarketplaceConnectorRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): FrameworkHealthReport {
    const active = input.connectors.filter((c) => c.currentState === "active").length;
    const suspended = input.connectors.filter((c) => c.currentState === "suspended").length;
    const failed = input.connectors.filter((c) => c.currentState === "failed").length;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (failed > 0) healthScore -= Math.min(30, failed * 10);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : failed > 0 && active === 0
        ? "failed"
        : input.consecutiveFailures > 1 || suspended > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Framework disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Connectors: ${input.connectors.length} registered · ${active} active`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      frameworkEnabled: input.config.enabled,
      registeredConnectors: input.connectors.length,
      activeConnectors: active,
      suspendedConnectors: suspended,
      failedConnectors: failed,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
