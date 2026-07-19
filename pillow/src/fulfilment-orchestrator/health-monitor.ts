/** R2-10 — Fulfilment health monitoring. */

import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";
import type {
  FulfilmentFailureFinding,
  FulfilmentHealthReport,
  FulfilmentRecord,
  FulfilmentValidationReport,
  InvalidFulfilmentFinding,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: FulfilmentValidationReport["decision"] | null = null;
  private routingFailures = 0;
  private blockedWorkflows = 0;
  private fulfilledCount = 0;
  private invalidRequestsDetected = 0;

  recordOperation(
    decision: FulfilmentValidationReport["decision"],
    failures: FulfilmentFailureFinding[] = [],
    invalidRequests: InvalidFulfilmentFinding[] = [],
    fulfilled = 0,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.routingFailures += 1;
    this.blockedWorkflows += failures.filter((f) => f.failureType === "workflow_blocked").length;
    this.routingFailures += failures.length;
    this.fulfilledCount += fulfilled;
    this.invalidRequestsDetected += invalidRequests.length;
  }

  buildReport(input: {
    config: FulfilmentOrchestratorConfiguration;
    records: FulfilmentRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): FulfilmentHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.routingFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Fulfilment orchestrator disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive routing failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Fulfilment records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      fulfilmentCount: input.records.length,
      lastRoutingAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      routingFailures: this.routingFailures,
      blockedWorkflows: this.blockedWorkflows,
      fulfilledCount: this.fulfilledCount,
      invalidRequestsDetected: this.invalidRequestsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.routingFailures = 0;
    this.blockedWorkflows = 0;
    this.fulfilledCount = 0;
    this.invalidRequestsDetected = 0;
  }
}
