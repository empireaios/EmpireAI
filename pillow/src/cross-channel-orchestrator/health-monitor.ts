/** R5-18 — Cross-Channel Orchestrator health monitor. */

import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";
import type {
  HealthStatus,
  OrchestrationEngineRecord,
  OrchestrationHealthReport,
  OrchestrationValidationReport,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: OrchestrationValidationReport["decision"] | null = null;

  recordOperation(decision: OrchestrationValidationReport["decision"]): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
  }

  buildReport(input: {
    config: CrossChannelOrchestratorConfiguration;
    record: OrchestrationEngineRecord | null;
    totalOrchestrationRecords: number;
    conflictedOrchestrations: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): OrchestrationHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.record?.healthStatus === "failed") healthScore = Math.min(healthScore, 40);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);
    if (input.conflictedOrchestrations > 0) healthScore = Math.min(healthScore, 75);

    const status: HealthStatus = !input.config.enabled
      ? "standby"
      : input.record?.healthStatus === "failed" || input.consecutiveFailures > 2
        ? "failed"
        : input.consecutiveFailures > 0 ||
            input.record?.healthStatus === "degraded" ||
            input.conflictedOrchestrations > 0
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Cross-Channel Orchestrator disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive operation failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`${input.totalOrchestrationRecords} orchestration record(s)`);
    notes.push(`${input.conflictedOrchestrations} conflicted orchestration(s)`);
    notes.push("Coordinated launch gated by validation");

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      lastOperationAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      totalOrchestrationRecords: input.totalOrchestrationRecords,
      conflictedOrchestrations: input.conflictedOrchestrations,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
  }
}
