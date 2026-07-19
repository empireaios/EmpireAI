/** R5-18 — Cross-Channel Orchestrator recovery manager. */

import { appendCcoLog } from "./cco-logging.js";
import type { CrossChannelOrchestratorConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: CrossChannelOrchestratorConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendCcoLog({
      event: "orchestration_failures",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendCcoLog({
      event: "recovery_attempt",
      level: "info",
      details: `Cross-Channel Orchestrator recovery attempt ${this.recoveryAttempts}`,
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
