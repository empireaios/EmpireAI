/** R2-18 — Fulfilment SLA monitor health monitoring. */

import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidSlaFinding,
  SlaFailureFinding,
  SlaHealthReport,
  SlaRecord,
  SlaValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastMonitorAt: string | null = null;
  private lastDecision: SlaValidationReport["decision"] | null = null;
  private monitoringFailures = 0;
  private breachCount = 0;
  private riskCount = 0;
  private alertsGenerated = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: SlaValidationReport["decision"],
    failures: SlaFailureFinding[] = [],
    invalidRecords: InvalidSlaFinding[] = [],
    breaches = 0,
    risks = 0,
    alerts = 0,
  ): void {
    this.lastMonitorAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.monitoringFailures += 1;
    this.monitoringFailures += failures.length;
    this.breachCount += breaches;
    this.riskCount += risks;
    this.alertsGenerated += alerts;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: FulfilmentSlaMonitorConfiguration;
    records: SlaRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SlaHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.monitoringFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (this.breachCount > 0) healthScore = Math.min(healthScore, 55);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Fulfilment SLA monitoring disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive monitoring failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`SLA records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      slaRecordCount: input.records.length,
      lastMonitorAt: this.lastMonitorAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      monitoringFailures: this.monitoringFailures,
      breachCount: this.breachCount,
      riskCount: this.riskCount,
      alertsGenerated: this.alertsGenerated,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastMonitorAt = null;
    this.lastDecision = null;
    this.monitoringFailures = 0;
    this.breachCount = 0;
    this.riskCount = 0;
    this.alertsGenerated = 0;
    this.invalidRecordsDetected = 0;
  }
}
