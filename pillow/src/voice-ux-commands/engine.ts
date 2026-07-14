import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import {
  appendVoiceCommandLog,
  getVoiceCommandLogs,
  resetVoiceCommandLogsForTesting,
} from "./voice-command-logging.js";
import { VoiceUxCommandController } from "./voice-ux-command-controller.js";
import { VoiceUxCommandManager } from "./voice-ux-command-manager.js";
import {
  buildVoiceUxCommandsConfiguration,
  type VoiceUxCommandsConfiguration,
} from "./configuration.js";
import { VOICE_UX_COMMANDS_SYSTEM_PATH } from "./paths.js";
import type {
  VoiceCommandInput,
  VoiceCommandRunReport,
  VoiceUxCommandsCockpitSnapshot,
  VoiceUxCommandsState,
} from "./types.js";

export interface VoiceUxCommandsOptions {
  configuration?: Partial<VoiceUxCommandsConfiguration>;
}

/**
 * Voice UX Commands (PILLOW-VUC-001 / T4-02).
 * Enables hands-free UX redesign conversation intake for the Grand King.
 * Safety: never applies, approves, or modifies files — interpretation only.
 */
export class VoiceUxCommandsEngine {
  private initializedAt: string | null = null;
  private readonly controller: VoiceUxCommandController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    naturalUxConversation: NaturalUxConversationEngine,
    uiStateMapper: UiStateMapperEngine | null,
    recommendationEngine: RecommendationEngine | null,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
    options: VoiceUxCommandsOptions = {},
  ) {
    const config = buildVoiceUxCommandsConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new VoiceUxCommandController(
      {
        naturalUxConversation,
        uiStateMapper,
        recommendationEngine,
        autonomousBuilderCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VoiceUxCommandsState> {
    const doc = await this.reader.readText(VOICE_UX_COMMANDS_SYSTEM_PATH);
    if (!doc?.includes("Voice UX Commands")) {
      throw new Error(
        `${VOICE_UX_COMMANDS_SYSTEM_PATH} missing — Voice UX Commands requires T4-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendVoiceCommandLog({
      event: "voice_command_engine_ready",
      level: "info",
      details: "Voice UX Commands initialized",
    });
    return this.getState();
  }

  getState(): VoiceUxCommandsState {
    if (!this.initializedAt) {
      throw new Error("Voice UX Commands not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      commandsCompleted: performance.totalCommands,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-VUC-001",
      missionId: "T4-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  processCommand(command: VoiceCommandInput): VoiceCommandRunReport {
    return this.controller.processCommand(command);
  }

  getLatestReport(): VoiceCommandRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): VoiceUxCommandsState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopVoiceUxCommands(): VoiceUxCommandsState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<VoiceUxCommandsConfiguration>,
  ): VoiceUxCommandsState {
    const next = buildVoiceUxCommandsConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Commands completed: ${state.performance.totalCommands}`,
        report
          ? `Last command: ${report.validation.decision} · type=${report.latestCommand?.voiceCommandType ?? "none"}`
          : "No voice commands yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VoiceUxCommandsCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const command = report?.latestCommand;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastCommandDecision,
      activeSessions: state.health.activeSessions,
      totalCommands: state.performance.totalCommands,
      clarificationsPending: command?.clarificationQuestions.length ?? 0,
      conversationLinks: state.performance.conversationLinksCreated,
      confidenceScore: command ? Math.round(command.confidenceScore * 100) : 0,
      totalTranscriptions: state.performance.totalTranscriptions,
      recentLogs: getVoiceCommandLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createVoiceUxCommands(
  bootstrap: EmpireBootstrapContext,
  naturalUxConversation: NaturalUxConversationEngine,
  uiStateMapper: UiStateMapperEngine | null,
  recommendationEngine: RecommendationEngine | null,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
  options?: VoiceUxCommandsOptions,
): VoiceUxCommandsEngine {
  return new VoiceUxCommandsEngine(
    bootstrap,
    naturalUxConversation,
    uiStateMapper,
    recommendationEngine,
    autonomousBuilderCertification,
    options,
  );
}

export function resetVoiceUxCommandsForTesting(): void {
  resetVoiceCommandLogsForTesting();
  new VoiceUxCommandManager().resetForTesting();
}
