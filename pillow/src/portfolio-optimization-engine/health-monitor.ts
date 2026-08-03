/** X2-16 — Portfolio optimization health monitoring. */

import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  OptimizationHealthReport,
  OptimizationValidationReport,
  PortfolioOptimizationEngineRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: OptimizationValidationReport["decision"] | null = null;

  recordOperation(decision: OptimizationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: PortfolioOptimizationEngineConfiguration;
    record: PortfolioOptimizationEngineRecord | null;
    totalOptimizationRecords: number;
    highPriorityOpportunities: number;
    averageExpectedBenefit: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): OptimizationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 30);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 3
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Portfolio Optimization Engine disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(
      `Optimizations: ${input.totalOptimizationRecords} · high-priority: ${input.highPriorityOpportunities} · avg benefit: ${input.averageExpectedBenefit}`,
    );
    notes.push("Automatic optimization execution blocked beyond approval policies");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalOptimizationRecords: input.totalOptimizationRecords,
      highPriorityOpportunities: input.highPriorityOpportunities,
      averageExpectedBenefit: input.averageExpectedBenefit,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
