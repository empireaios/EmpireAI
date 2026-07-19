/** R5-04 — TikTok Ads health monitor. */

import type { TikTokAdsIntegrationConfiguration } from "./configuration.js";
import type {
  TikTokAdsEngineRecord,
  TikTokAdsHealthReport,
  TikTokAdsValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: TikTokAdsValidationReport["decision"] | null = null;

  recordOperation(decision: TikTokAdsValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: TikTokAdsIntegrationConfiguration;
    record: TikTokAdsEngineRecord | null;
    totalCampaigns: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): TikTokAdsHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 || input.record?.healthStatus === "degraded"
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("TikTok Ads Integration disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalCampaigns} campaign record(s)`);

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
      totalCampaigns: input.totalCampaigns,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
