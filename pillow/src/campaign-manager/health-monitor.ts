/** R5-07 — Campaign Manager health monitor. */

import type { CampaignManagerConfiguration } from "./configuration.js";
import type {
  CampaignEngineRecord,
  CampaignHealthReport,
  CampaignValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CampaignValidationReport["decision"] | null = null;

  recordOperation(decision: CampaignValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CampaignManagerConfiguration;
    record: CampaignEngineRecord | null;
    totalCampaigns: number;
    runningCampaigns: number;
    failedCampaigns: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CampaignHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.failedCampaigns > 0) healthScore = Math.min(healthScore, 70);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Campaign Manager disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCampaigns} campaign(s)`);
    notes.push(`${input.runningCampaigns} running`);
    notes.push(`${input.failedCampaigns} failed`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalCampaigns: input.totalCampaigns,
      runningCampaigns: input.runningCampaigns,
      failedCampaigns: input.failedCampaigns,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
