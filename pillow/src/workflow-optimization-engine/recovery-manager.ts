/** T2-05 — Automatic Workflow Optimization recovery. */

import { appendWorkflowOptimizationLog } from "./workflow-optimization-logging.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: WorkflowOptimizationConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendWorkflowOptimizationLog({
      event: "optimization_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendWorkflowOptimizationLog({
      event: "recovery_attempt",
      level: "info",
      details: `Recovery attempt ${this.recoveryAttempts} after ${this.consecutiveFailures} failures`,
    });
    return this.recoveryAttempts <= config.maxRetryAttempts;
  }

  getRecoveryAttempts(): number {
    return this.recoveryAttempts;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  reset(): void {
    this.recoveryAttempts = 0;
    this.consecutiveFailures = 0;
  }
}
