/** R2-14 — Warehouse intelligence health monitoring. */

import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  InvalidWarehouseFinding,
  WarehouseFailureFinding,
  WarehouseHealthReport,
  WarehouseRecord,
  WarehouseValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastCoordinationAt: string | null = null;
  private lastDecision: WarehouseValidationReport["decision"] | null = null;
  private warehouseFailures = 0;
  private bottleneckCount = 0;
  private shortageCount = 0;
  private overstockCount = 0;
  private invalidRecordsDetected = 0;

  recordOperation(
    decision: WarehouseValidationReport["decision"],
    failures: WarehouseFailureFinding[] = [],
    invalidRecords: InvalidWarehouseFinding[] = [],
    bottlenecks = 0,
    shortages = 0,
    overstock = 0,
  ): void {
    this.lastCoordinationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.warehouseFailures += 1;
    this.warehouseFailures += failures.length;
    this.bottleneckCount += bottlenecks;
    this.shortageCount += shortages;
    this.overstockCount += overstock;
    this.invalidRecordsDetected += invalidRecords.length;
  }

  buildReport(input: {
    config: WarehouseIntelligenceConfiguration;
    records: WarehouseRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): WarehouseHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) healthScore -= Math.min(40, input.consecutiveFailures * 15);
    if (!input.config.enabled) healthScore = 50;
    if (this.warehouseFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Warehouse intelligence disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive warehouse failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Warehouse records: ${input.records.length}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      warehouseCount: input.records.length,
      lastCoordinationAt: this.lastCoordinationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      warehouseFailures: this.warehouseFailures,
      bottleneckCount: this.bottleneckCount,
      shortageCount: this.shortageCount,
      overstockCount: this.overstockCount,
      invalidRecordsDetected: this.invalidRecordsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastCoordinationAt = null;
    this.lastDecision = null;
    this.warehouseFailures = 0;
    this.bottleneckCount = 0;
    this.shortageCount = 0;
    this.overstockCount = 0;
    this.invalidRecordsDetected = 0;
  }
}
