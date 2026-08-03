/** X4-06 — Regional Compliance Engine health monitoring. */

import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type {
  ComplianceValidationReport,
  HealthStatus,
  RegionalComplianceEngineRecord,
  RceHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ComplianceValidationReport["decision"] | null = null;

  recordOperation(decision: ComplianceValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: RegionalComplianceEngineConfiguration;
    record: RegionalComplianceEngineRecord | null;
    totalComplianceRecords: number;
    violationCount: number;
    highRiskCount: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): RceHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Regional Compliance Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Records: ${input.totalComplianceRecords} · violations: ${input.violationCount} · high-risk: ${input.highRiskCount}`,
    );
    notes.push("Never falsely certify compliance — certificationClaim always none");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalComplianceRecords: input.totalComplianceRecords,
      violationCount: input.violationCount,
      highRiskCount: input.highRiskCount,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
