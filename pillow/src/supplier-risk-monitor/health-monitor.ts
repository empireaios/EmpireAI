/** R2-16 — Supplier risk monitor health monitoring. */

import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidSupplierRiskFinding,
  SupplierRiskFailureFinding,
  SupplierRiskHealthReport,
  SupplierRiskRecord,
  SupplierRiskValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastMonitorAt: string | null = null;
  private lastDecision: SupplierRiskValidationReport["decision"] | null = null;
  private monitoringFailures = 0;
  private highRiskCount = 0;
  private disruptionCount = 0;
  private alertsGenerated = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: SupplierRiskValidationReport["decision"],
    failures: SupplierRiskFailureFinding[] = [],
    invalidRecords: InvalidSupplierRiskFinding[] = [],
    highRisk = 0,
    disruptions = 0,
    alerts = 0,
  ): void {
    this.lastMonitorAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.monitoringFailures += 1;
    this.monitoringFailures += failures.length;
    this.highRiskCount += highRisk;
    this.disruptionCount += disruptions;
    this.alertsGenerated += alerts;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: SupplierRiskMonitorConfiguration;
    records: SupplierRiskRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): SupplierRiskHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.monitoringFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Supplier risk monitoring disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive monitoring failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Supplier risk records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      supplierCount: input.records.length,
      lastMonitorAt: this.lastMonitorAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      monitoringFailures: this.monitoringFailures,
      highRiskCount: this.highRiskCount,
      disruptionCount: this.disruptionCount,
      alertsGenerated: this.alertsGenerated,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastMonitorAt = null;
    this.lastDecision = null;
    this.monitoringFailures = 0;
    this.highRiskCount = 0;
    this.disruptionCount = 0;
    this.alertsGenerated = 0;
    this.invalidRecordsDetected = 0;
  }
}
