/** T4-02 — Voice UX Commands health monitoring. */

import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  VoiceCommandHealthReport,
  VoiceCommandPerformanceStats,
  VoiceDecision,
} from "./types.js";

export class HealthMonitor {
  private lastCommandAt: string | null = null;
  private lastDecision: VoiceDecision | null = null;

  recordCommand(success: boolean, decision: VoiceDecision): void {
    this.lastCommandAt = new Date().toISOString();
    this.lastDecision = decision;
    void success;
  }

  buildReport(input: {
    config: VoiceUxCommandsConfiguration;
    status: EngineStatus;
    performance: VoiceCommandPerformanceStats;
    commandsCompleted: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
    activeSessions: number;
  }): VoiceCommandHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (input.status === "failed") healthScore = Math.min(healthScore, 25);
    if (this.lastDecision === "fail" || this.lastDecision === "blocked") {
      healthScore = Math.min(healthScore, 40);
    }

    const status =
      !input.config.enabled
        ? "standby"
        : input.status === "failed"
          ? "failed"
          : input.consecutiveFailures > 1
            ? "degraded"
            : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Voice UX commands disabled by configuration");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive voice command failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    if (input.activeSessions > 0) notes.push(`${input.activeSessions} active session(s)`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      voiceCommandsEnabled: input.config.enabled,
      commandsCompleted: input.commandsCompleted,
      lastCommandAt: this.lastCommandAt,
      lastCommandDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      activeSessions: input.activeSessions,
      notes,
    };
  }
}
