/** R2-13 — Return management health monitoring. */

import type { ReturnManagementConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidReturnFinding,
  ReturnFailureFinding,
  ReturnHealthReport,
  ReturnRecord,
  ReturnValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ReturnValidationReport["decision"] | null = null;
  private returnFailures = 0;
  private authorizedCount = 0;
  private completedCount = 0;
  private failedCount = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: ReturnValidationReport["decision"],
    failures: ReturnFailureFinding[] = [],
    invalidRecords: InvalidReturnFinding[] = [],
    authorized = 0,
    completed = 0,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.returnFailures += 1;
    this.returnFailures += failures.length;
    this.authorizedCount += authorized;
    this.completedCount += completed;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: ReturnManagementConfiguration;
    records: ReturnRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ReturnHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.returnFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const failedReturns = input.records.filter(
      (r) => r.returnCompletionStatus === "failed" || r.returnAuthorizationStatus === "denied",
    ).length;

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Return management disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive return failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Return records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      returnCount: input.records.length,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      returnFailures: this.returnFailures,
      authorizedCount: this.authorizedCount,
      completedCount: this.completedCount,
      failedCount: failedReturns,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.returnFailures = 0;
    this.authorizedCount = 0;
    this.completedCount = 0;
    this.failedCount = 0;
    this.invalidRecordsDetected = 0;
  }
}
