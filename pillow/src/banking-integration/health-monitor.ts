/** R3-03 — Banking integration health monitoring. */

import type { BankingIntegrationConfiguration } from "./configuration.js";
import type {
  BankingHealthReport,
  BankingIntegrationRecord,
  BankingValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: BankingValidationReport["decision"] | null = null;

  recordOperation(decision: BankingValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: BankingIntegrationConfiguration;
    record: BankingIntegrationRecord | null;
    synchronizedAccounts: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): BankingHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Banking integration disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.synchronizedAccounts} synchronized account(s) tracked`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      integrationEnabled: input.config.enabled,
      authenticationStatus: input.record?.authenticationStatus ?? "unauthenticated",
      connectionStatus: input.record?.connectionStatus ?? "disconnected",
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      synchronizedAccounts: input.synchronizedAccounts,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
