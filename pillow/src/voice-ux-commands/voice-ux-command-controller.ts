/** T4-02 — Voice UX Commands orchestration controller. */

import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import { appendVoiceCommandLog } from "./voice-command-logging.js";
import {
  VoiceUxCommandManager,
  type VoiceUxCommandEngineBundle,
} from "./voice-ux-command-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { VoiceUxCommandsConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  VoiceCommandInput,
  VoiceCommandPerformanceStats,
  VoiceCommandRunReport,
} from "./types.js";

export type VoiceUxCommandsEngineBundle = VoiceUxCommandEngineBundle & {
  naturalUxConversation: NaturalUxConversationEngine;
  uiStateMapper: UiStateMapperEngine | null;
  recommendationEngine: RecommendationEngine | null;
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null;
};

export class VoiceUxCommandController {
  private config: VoiceUxCommandsConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: VoiceCommandRunReport | null = null;
  private readonly manager = new VoiceUxCommandManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: VoiceCommandPerformanceStats = {
    totalCommands: 0,
    successfulCommands: 0,
    failedCommands: 0,
    totalTranscriptions: 0,
    clarificationsRequested: 0,
    conversationLinksCreated: 0,
    averageCommandDurationMs: 0,
    peakCommandDurationMs: 0,
  };

  constructor(
    private readonly engines: VoiceUxCommandsEngineBundle,
    config: VoiceUxCommandsConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendVoiceCommandLog({
      event: "voice_command_engine_initialized",
      level: "info",
      details: "Voice UX Commands started",
    });
    try {
      void this.engines.naturalUxConversation.getState();
      void this.engines.autonomousBuilderCertification?.getState();
    } catch {
      appendVoiceCommandLog({
        event: "partial_voice_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendVoiceCommandLog({
      event: "voice_command_engine_stop",
      level: "info",
      details: "Voice UX Commands stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): VoiceUxCommandsConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: VoiceUxCommandsConfiguration): void {
    this.config = config;
  }

  getLatestReport(): VoiceCommandRunReport | null {
    return this.latestReport;
  }

  getPerformance(): VoiceCommandPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): VoiceUxCommandManager {
    return this.manager;
  }

  processCommand(command: VoiceCommandInput): VoiceCommandRunReport {
    if (!this.config.enabled) {
      throw new Error("Voice UX Commands are disabled by configuration");
    }

    this.status = "listening";

    try {
      this.status = "transcribing";
      const report = this.manager.processCommand({
        command,
        config: this.config,
        engines: this.engines,
      });

      const latest = report.latestCommand;
      if (latest?.processingStatus === "awaiting_clarification") {
        this.status = "clarifying";
      } else if (latest?.processingStatus === "interpreted") {
        this.status = "interpreting";
      } else {
        this.status = "idle";
      }

      this.latestReport = report;
      this.performance.totalCommands += 1;
      this.performance.totalTranscriptions += 1;
      this.performance.clarificationsRequested +=
        latest?.clarificationQuestions.length ?? 0;
      this.performance.conversationLinksCreated += latest?.linkedConversationRunId
        ? 1
        : 0;
      this.performance.peakCommandDurationMs = Math.max(
        this.performance.peakCommandDurationMs,
        report.durationMs,
      );
      this.performance.averageCommandDurationMs = Math.round(
        (this.performance.averageCommandDurationMs *
          (this.performance.totalCommands - 1) +
          report.durationMs) /
          this.performance.totalCommands,
      );

      const success =
        report.validation.decision === "pass" ||
        report.validation.decision === "partial";
      if (success) {
        this.performance.successfulCommands += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedCommands += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Voice command decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordCommand(success, report.validation.decision);
      if (this.status !== "clarifying") {
        this.status = "idle";
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice command failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedCommands += 1;
      appendVoiceCommandLog({
        event: "voice_command_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
