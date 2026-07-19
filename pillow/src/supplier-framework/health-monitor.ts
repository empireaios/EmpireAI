/** R2-01 — Framework health monitoring. */

import type { SupplierFrameworkConfiguration } from "./configuration.js";
import type {
  FrameworkHealthReport,
  HealthStatus,
  SupplierFrameworkRecord,
  SupplierValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: SupplierValidationReport["decision"] | null = null;

  recordOperation(decision: SupplierValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: SupplierFrameworkConfiguration;
    suppliers: SupplierFrameworkRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): FrameworkHealthReport {
    const active = input.suppliers.filter((s) => s.operationalState === "active").length;
    const suspended = input.suppliers.filter((s) => s.operationalState === "suspended").length;
    const failed = input.suppliers.filter((s) => s.operationalState === "failed").length;

    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (failed > 0) healthScore -= Math.min(30, failed * 10);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : failed > 0 && active === 0
        ? "failed"
        : input.consecutiveFailures > 1 || suspended > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Supplier framework disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Suppliers: ${input.suppliers.length} registered · ${active} active`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      frameworkEnabled: input.config.enabled,
      registeredSuppliers: input.suppliers.length,
      activeSuppliers: active,
      suspendedSuppliers: suspended,
      failedSuppliers: failed,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }
}
