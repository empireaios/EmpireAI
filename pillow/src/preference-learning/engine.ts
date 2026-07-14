import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import {
  appendPreferenceLog,
  getPreferenceLogs,
  resetPreferenceLogsForTesting,
} from "./preference-logging.js";
import { PreferenceLearningController } from "./preference-learning-controller.js";
import { PreferenceLearningManager } from "./preference-learning-manager.js";
import {
  buildPreferenceLearningConfiguration,
  type PreferenceLearningConfiguration,
} from "./configuration.js";
import { PREFERENCE_LEARNING_SYSTEM_PATH } from "./paths.js";
import type {
  PreferenceLearningInput,
  PreferenceLearningRunReport,
  PreferenceLearningCockpitSnapshot,
  PreferenceLearningState,
} from "./types.js";

export interface PreferenceLearningOptions {
  configuration?: Partial<PreferenceLearningConfiguration>;
}

/**
 * Preference Learning (PILLOW-PL-001 / T4-08).
 * Learns Grand King collaboration preferences from explicit behavior.
 * Safety: learn only — never approves, executes, or overrides explicit instructions.
 */
export class PreferenceLearningEngine {
  private initializedAt: string | null = null;
  private readonly controller: PreferenceLearningController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    approvalWorkflow: ApprovalWorkflowEngine,
    explainDecisions: ExplainDecisionsEngine,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    naturalUxConversation: NaturalUxConversationEngine,
    voiceUxCommands: VoiceUxCommandsEngine,
    screenAnnotation: ScreenAnnotationEngine,
    sideBySideComparison: SideBySideComparisonEngine,
    options: PreferenceLearningOptions = {},
  ) {
    const config = buildPreferenceLearningConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new PreferenceLearningController(
      {
        approvalWorkflow,
        explainDecisions,
        multiProposalGenerator,
        naturalUxConversation,
        voiceUxCommands,
        screenAnnotation,
        sideBySideComparison,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PreferenceLearningState> {
    const doc = await this.reader.readText(PREFERENCE_LEARNING_SYSTEM_PATH);
    if (!doc?.includes("Preference Learning")) {
      throw new Error(
        `${PREFERENCE_LEARNING_SYSTEM_PATH} missing — Preference Learning requires T4-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPreferenceLog({
      event: "preference_learning_ready",
      level: "info",
      details: "Preference Learning initialized",
    });
    return this.getState();
  }

  getState(): PreferenceLearningState {
    if (!this.initializedAt) {
      throw new Error("Preference Learning not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      sessionsCompleted: performance.totalLearningSessions,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-PL-001",
      missionId: "T4-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      learnedPreferences: this.controller.getLearnedPreferences(),
      currentPreferenceVersion: this.controller.getManager().getCurrentPreferenceVersion(),
      health,
      performance,
    };
  }

  learn(input: PreferenceLearningInput = {}): PreferenceLearningRunReport {
    return this.controller.learn(input);
  }

  getLatestReport(): PreferenceLearningRunReport | null {
    return this.controller.getLatestReport();
  }

  getLearnedPreferences() {
    return this.controller.getLearnedPreferences();
  }

  endSession(sessionId: string): PreferenceLearningState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopPreferenceLearning(): PreferenceLearningState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<PreferenceLearningConfiguration>,
  ): PreferenceLearningState {
    const next = buildPreferenceLearningConfiguration(this.bootstrap.repositoryRoot, {
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
        `Learning sessions: ${state.performance.totalLearningSessions}`,
        `Preference version: ${state.currentPreferenceVersion}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.preferences.length} preferences`
          : "No learning sessions yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PreferenceLearningCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const avgConfidence =
      state.learnedPreferences.length > 0
        ? state.learnedPreferences.reduce((s, p) => s + p.confidenceScore, 0) /
          state.learnedPreferences.length
        : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      activeSessions: state.health.activeSessions,
      totalLearningSessions: state.performance.totalLearningSessions,
      preferencesLearned: state.performance.totalPreferencesLearned,
      preferenceVersion: state.currentPreferenceVersion,
      confidenceScore: Math.round(avgConfidence * 100),
      recentLogs: getPreferenceLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createPreferenceLearning(
  bootstrap: EmpireBootstrapContext,
  approvalWorkflow: ApprovalWorkflowEngine,
  explainDecisions: ExplainDecisionsEngine,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  naturalUxConversation: NaturalUxConversationEngine,
  voiceUxCommands: VoiceUxCommandsEngine,
  screenAnnotation: ScreenAnnotationEngine,
  sideBySideComparison: SideBySideComparisonEngine,
  options?: PreferenceLearningOptions,
): PreferenceLearningEngine {
  return new PreferenceLearningEngine(
    bootstrap,
    approvalWorkflow,
    explainDecisions,
    multiProposalGenerator,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    sideBySideComparison,
    options,
  );
}

export function resetPreferenceLearningForTesting(): void {
  resetPreferenceLogsForTesting();
  new PreferenceLearningManager().resetForTesting();
}
