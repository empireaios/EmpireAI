/** R4-09 — Ticket Management Engine health monitor. */

import type { TicketManagementEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  TicketEngineRecord,
  TicketHealthReport,
  TicketValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TicketValidationReport["decision"] | null = null;

  recordOperation(decision: TicketValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: TicketManagementEngineConfiguration;
    record: TicketEngineRecord | null;
    totalTickets: number;
    openTickets: number;
    assignedTickets: number;
    resolvedTickets: number;
    overdueTickets: number;
    stalledTickets: number;
    failedTickets: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TicketHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedTickets > 0) healthScore -= Math.min(20, input.failedTickets * 5);
    if (input.overdueTickets > 0) healthScore -= Math.min(15, input.overdueTickets * 3);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Ticket management disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalTickets} ticket(s)`);
    notes.push(
      `${input.openTickets} open · ${input.assignedTickets} assigned · ${input.resolvedTickets} resolved`,
    );
    if (input.overdueTickets > 0) notes.push(`${input.overdueTickets} overdue ticket(s)`);
    if (input.stalledTickets > 0) notes.push(`${input.stalledTickets} stalled ticket(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalTickets: input.totalTickets,
      openTickets: input.openTickets,
      assignedTickets: input.assignedTickets,
      resolvedTickets: input.resolvedTickets,
      overdueTickets: input.overdueTickets,
      stalledTickets: input.stalledTickets,
      failedTickets: input.failedTickets,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
