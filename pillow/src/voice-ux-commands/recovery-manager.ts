/** T4-02 — Automatic Voice UX Commands recovery. */

import { appendVoiceCommandLog } from "./voice-command-logging.js";
import type { VoiceUxCommandsConfiguration } from "./configuration.js";

export class RecoveryManager {
  private recoveryAttempts = 0;
  private consecutiveFailures = 0;

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  recordFailure(error: string, config: VoiceUxCommandsConfiguration): boolean {
    this.consecutiveFailures += 1;
    appendVoiceCommandLog({
      event: "voice_command_failure",
      level: "warn",
      details: `${error} (consecutive: ${this.consecutiveFailures})`,
    });

    if (!config.autoRecover) return false;
    if (this.consecutiveFailures < 2) return false;

    this.recoveryAttempts += 1;
    appendVoiceCommandLog({
      event: "recovery_attempt",
      level: "info",
      details: `Recovery attempt ${this.recoveryAttempts}`,
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
