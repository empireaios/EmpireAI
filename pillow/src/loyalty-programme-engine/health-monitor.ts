/** R4-12 — Loyalty Programme Engine health monitor. */

import type { LoyaltyProgrammeEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  LoyaltyEngineRecord,
  LoyaltyHealthReport,
  LoyaltyValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: LoyaltyValidationReport["decision"] | null = null;

  recordOperation(decision: LoyaltyValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: LoyaltyProgrammeEngineConfiguration;
    record: LoyaltyEngineRecord | null;
    totalProgrammes: number;
    totalMembers: number;
    totalLoyaltyRecords: number;
    totalPointsAwarded: number;
    totalPointsRedeemed: number;
    activeAbuseAlerts: number;
    failedRecords: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): LoyaltyHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedRecords > 0) healthScore -= Math.min(20, input.failedRecords * 5);
    if (input.activeAbuseAlerts > 0) healthScore -= Math.min(15, input.activeAbuseAlerts * 3);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Loyalty programme engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    notes.push(`${input.totalProgrammes} programme(s) · ${input.totalMembers} member(s)`);
    notes.push(
      `${input.totalLoyaltyRecords} loyalty record(s) · ${input.totalPointsAwarded} awarded · ${input.totalPointsRedeemed} redeemed`,
    );
    if (input.activeAbuseAlerts > 0) {
      notes.push(`${input.activeAbuseAlerts} active abuse alert(s)`);
    }

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalProgrammes: input.totalProgrammes,
      totalMembers: input.totalMembers,
      totalLoyaltyRecords: input.totalLoyaltyRecords,
      totalPointsAwarded: input.totalPointsAwarded,
      totalPointsRedeemed: input.totalPointsRedeemed,
      activeAbuseAlerts: input.activeAbuseAlerts,
      failedRecords: input.failedRecords,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
