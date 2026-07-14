import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import {
  appendProposalLog,
  getProposalLogs,
  resetProposalLogsForTesting,
} from "./proposal-logging.js";
import { MultiProposalGeneratorController } from "./multi-proposal-generator-controller.js";
import { MultiProposalGeneratorManager } from "./multi-proposal-generator-manager.js";
import {
  buildMultiProposalGeneratorConfiguration,
  type MultiProposalGeneratorConfiguration,
} from "./configuration.js";
import { MULTI_PROPOSAL_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  MultiProposalGeneratorCockpitSnapshot,
  MultiProposalGeneratorState,
  ProposalGenerationInput,
  ProposalGenerationRunReport,
} from "./types.js";

export interface MultiProposalGeneratorOptions {
  configuration?: Partial<MultiProposalGeneratorConfiguration>;
}

/**
 * Multi-Proposal Generator (PILLOW-MPG-001 / T4-04).
 * Generates multiple redesign options for Grand King review.
 * Safety: options only — never applies, approves, or modifies files.
 */
export class MultiProposalGeneratorEngine {
  private initializedAt: string | null = null;
  private readonly controller: MultiProposalGeneratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    naturalUxConversation: NaturalUxConversationEngine,
    voiceUxCommands: VoiceUxCommandsEngine,
    screenAnnotation: ScreenAnnotationEngine,
    uiStateMapper: UiStateMapperEngine | null,
    recommendationEngine: RecommendationEngine | null,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
    options: MultiProposalGeneratorOptions = {},
  ) {
    const config = buildMultiProposalGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new MultiProposalGeneratorController(
      {
        naturalUxConversation,
        voiceUxCommands,
        screenAnnotation,
        uiStateMapper,
        recommendationEngine,
        autonomousBuilderCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MultiProposalGeneratorState> {
    const doc = await this.reader.readText(MULTI_PROPOSAL_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("Multi-Proposal Generator")) {
      throw new Error(
        `${MULTI_PROPOSAL_GENERATOR_SYSTEM_PATH} missing — Multi-Proposal Generator requires T4-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendProposalLog({
      event: "multi_proposal_generator_ready",
      level: "info",
      details: "Multi-Proposal Generator initialized",
    });
    return this.getState();
  }

  getState(): MultiProposalGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Multi-Proposal Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      generationsCompleted: performance.totalGenerations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-MPG-001",
      missionId: "T4-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generateProposals(input: ProposalGenerationInput = {}): ProposalGenerationRunReport {
    return this.controller.generateProposals(input);
  }

  getLatestReport(): ProposalGenerationRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): MultiProposalGeneratorState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopMultiProposalGenerator(): MultiProposalGeneratorState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<MultiProposalGeneratorConfiguration>,
  ): MultiProposalGeneratorState {
    const next = buildMultiProposalGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Generations completed: ${state.performance.totalGenerations}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.proposals.length} proposals`
          : "No proposal generations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MultiProposalGeneratorCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const avgConfidence =
      report && report.proposals.length > 0
        ? report.proposals.reduce((s, p) => s + p.confidenceScore, 0) / report.proposals.length
        : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastGenerationDecision,
      activeSessions: state.health.activeSessions,
      totalGenerations: state.performance.totalGenerations,
      totalProposals: state.performance.totalProposalsGenerated,
      categoriesCovered: report?.validation.categoriesCovered ?? 0,
      confidenceScore: Math.round(avgConfidence * 100),
      recentLogs: getProposalLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMultiProposalGenerator(
  bootstrap: EmpireBootstrapContext,
  naturalUxConversation: NaturalUxConversationEngine,
  voiceUxCommands: VoiceUxCommandsEngine,
  screenAnnotation: ScreenAnnotationEngine,
  uiStateMapper: UiStateMapperEngine | null,
  recommendationEngine: RecommendationEngine | null,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
  options?: MultiProposalGeneratorOptions,
): MultiProposalGeneratorEngine {
  return new MultiProposalGeneratorEngine(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    uiStateMapper,
    recommendationEngine,
    autonomousBuilderCertification,
    options,
  );
}

export function resetMultiProposalGeneratorForTesting(): void {
  resetProposalLogsForTesting();
  new MultiProposalGeneratorManager().resetForTesting();
}
