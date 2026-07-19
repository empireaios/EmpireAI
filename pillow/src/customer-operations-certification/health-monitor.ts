/** R4-19 — Customer operations certification health monitor. */

import type { CustomerOperationsCertificationConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  HealthStatus,
  CustomerOperationsCertificationHealthReport,
} from "./types.js";

export class HealthMonitor {
  private lastCertificationAt: string | null = null;
  private lastCertificationStatus: CertificationStatus | null = null;
  private certificationFailures = 0;
  private missionsCertified = 0;

  recordCertification(status: CertificationStatus, missionsPassed: number): void {
    this.lastCertificationAt = new Date().toISOString();
    this.lastCertificationStatus = status;
    if (status === "failed") this.certificationFailures += 1;
    this.missionsCertified = missionsPassed;
  }

  buildReport(input: {
    config: CustomerOperationsCertificationConfiguration;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CustomerOperationsCertificationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastCertificationStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastCertificationStatus === "partial") healthScore = Math.min(healthScore, 70);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastCertificationStatus === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Customer operations certification disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive certification failures`);
    }
    if (input.recoveryAttempts > 0) {
      notes.push(`${input.recoveryAttempts} recovery attempts`);
    }
    notes.push(`${this.missionsCertified} mission(s) certified in last run`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastCertificationAt: this.lastCertificationAt,
      lastCertificationStatus: this.lastCertificationStatus,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      certificationFailures: this.certificationFailures,
      missionsCertified: this.missionsCertified,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastCertificationAt = null;
    this.lastCertificationStatus = null;
    this.certificationFailures = 0;
    this.missionsCertified = 0;
  }
}
