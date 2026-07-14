import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import {
  appendConversationLog,
  getConversationLogs,
  resetConversationLogsForTesting,
} from "./conversation-logging.js";
import { NaturalUxConversationController } from "./natural-ux-conversation-controller.js";
import { NaturalUxConversationManager } from "./natural-ux-conversation-manager.js";
import {
  buildNaturalUxConversationConfiguration,
  type NaturalUxConversationConfiguration,
} from "./configuration.js";
import { NATURAL_UX_CONVERSATION_SYSTEM_PATH } from "./paths.js";
import type {
  ConversationRunReport,
  NaturalUxConversationCockpitSnapshot,
  NaturalUxConversationState,
} from "./types.js";

export interface NaturalUxConversationOptions {
  configuration?: Partial<NaturalUxConversationConfiguration>;
}

/**
 * Natural UX Conversation (PILLOW-NUC-001 / T4-01).
 * Enables natural-language UX collaboration between the Grand King and Pillow.
 */
export class NaturalUxConversationEngine {
  private initializedAt: string | null = null;
  private readonly controller: NaturalUxConversationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine,
    uxIntelligenceCertification: UxIntelligenceCertificationEngine,
    recommendationEngine: RecommendationEngine,
    frontendBuilder: FrontendBuilder,
    options: NaturalUxConversationOptions = {},
  ) {
    const config = buildNaturalUxConversationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new NaturalUxConversationController(
      {
        autonomousBuilderCertification,
        uxIntelligenceCertification,
        recommendationEngine,
        frontendBuilder,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<NaturalUxConversationState> {
    const doc = await this.reader.readText(NATURAL_UX_CONVERSATION_SYSTEM_PATH);
    if (!doc?.includes("Natural UX Conversation")) {
      throw new Error(
        `${NATURAL_UX_CONVERSATION_SYSTEM_PATH} missing — Natural UX Conversation requires T4-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendConversationLog({
      event: "conversation_engine_ready",
      level: "info",
      details: "Natural UX Conversation initialized",
    });
    return this.getState();
  }

  getState(): NaturalUxConversationState {
    if (!this.initializedAt) {
      throw new Error("Natural UX Conversation not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      conversationsCompleted: performance.totalConversations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-NUC-001",
      missionId: "T4-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  converse(userRequest: string, sessionId?: string): ConversationRunReport {
    return this.controller.converse(userRequest, sessionId);
  }

  getLatestReport(): ConversationRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): NaturalUxConversationState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopNaturalUxConversation(): NaturalUxConversationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<NaturalUxConversationConfiguration>,
  ): NaturalUxConversationState {
    const next = buildNaturalUxConversationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Conversations completed: ${state.performance.totalConversations}`,
        report
          ? `Last turn: ${report.validation.decision} · intent=${report.latestTurn?.intentCategory ?? "none"}`
          : "No conversations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): NaturalUxConversationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const turn = report?.latestTurn;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastConversationDecision,
      activeSessions: state.health.activeSessions,
      totalTurns: state.performance.totalTurns,
      clarificationsPending:
        turn?.clarificationStatus === "pending" ? turn.clarificationQuestions.length : 0,
      builderRequestsCount: state.performance.builderRequestsGenerated,
      confidenceScore: turn ? Math.round(turn.confidenceScore * 100) : 0,
      totalConversations: state.performance.totalConversations,
      recentLogs: getConversationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createNaturalUxConversation(
  bootstrap: EmpireBootstrapContext,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine,
  uxIntelligenceCertification: UxIntelligenceCertificationEngine,
  recommendationEngine: RecommendationEngine,
  frontendBuilder: FrontendBuilder,
  options?: NaturalUxConversationOptions,
): NaturalUxConversationEngine {
  return new NaturalUxConversationEngine(
    bootstrap,
    autonomousBuilderCertification,
    uxIntelligenceCertification,
    recommendationEngine,
    frontendBuilder,
    options,
  );
}

export function resetNaturalUxConversationForTesting(): void {
  resetConversationLogsForTesting();
  new NaturalUxConversationManager().resetForTesting();
}
