/** T5-10 — Certification health monitoring. */

import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import type {
  CertificationDecision,
  CertificationHealthReport,
  CertificationStatus,
} from "./types.js";

export class HealthMonitor {
  private lastCertificationAt: string | null = null;
  private lastDecision: CertificationDecision | null = null;

  recordCertification(decision: CertificationDecision): void {
    this.lastCertificationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: VisualIntelligenceCertificationConfiguration;
    status: CertificationStatus;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CertificationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : input.status === "failed"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Certification disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive certification failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      certificationEnabled: input.config.enabled,
      lastCertificationAt: this.lastCertificationAt,
      lastCertificationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
