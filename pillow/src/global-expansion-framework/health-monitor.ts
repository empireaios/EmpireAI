/** X4-01 — Global Expansion Framework health monitoring. */

import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";
import type {
  GlobalExpansionFrameworkRecord,
  ExpansionFrameworkHealthReport,
  ExpansionValidationReport,
  HealthStatus,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: ExpansionValidationReport["decision"] | null = null;

  recordOperation(decision: ExpansionValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: GlobalExpansionFrameworkConfiguration;
    modules: GlobalExpansionFrameworkRecord[];
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): ExpansionFrameworkHealthReport {
    const active = input.modules.filter((m) => m.operationalState === "active").length;
    const suspended = input.modules.filter((m) => m.operationalState === "suspended").length;
    const failed = input.modules.filter((m) => m.operationalState === "failed").length;

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
    if (!input.config.enabled) notes.push("Global Expansion Framework disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Modules: ${input.modules.length} registered · ${active} active`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      frameworkEnabled: input.config.enabled,
      registeredModules: input.modules.length,
      activeModules: active,
      suspendedModules: suspended,
      failedModules: failed,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
