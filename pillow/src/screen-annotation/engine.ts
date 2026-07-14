import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import {
  appendAnnotationLog,
  getAnnotationLogs,
  resetAnnotationLogsForTesting,
} from "./annotation-logging.js";
import { ScreenAnnotationController } from "./screen-annotation-controller.js";
import { ScreenAnnotationManager } from "./screen-annotation-manager.js";
import {
  buildScreenAnnotationConfiguration,
  type ScreenAnnotationConfiguration,
} from "./configuration.js";
import { SCREEN_ANNOTATION_SYSTEM_PATH } from "./paths.js";
import type {
  AnnotationInput,
  AnnotationRunReport,
  ScreenAnnotationCockpitSnapshot,
  ScreenAnnotationState,
} from "./types.js";

export interface ScreenAnnotationOptions {
  configuration?: Partial<ScreenAnnotationConfiguration>;
}

/**
 * Screen Annotation (PILLOW-SA-001 / T4-03).
 * Enables point-and-edit visual UX collaboration for the Grand King.
 * Safety: never applies, approves, or modifies files — interpretation only.
 */
export class ScreenAnnotationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ScreenAnnotationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    naturalUxConversation: NaturalUxConversationEngine,
    voiceUxCommands: VoiceUxCommandsEngine,
    uiStateMapper: UiStateMapperEngine | null,
    componentRecognition: ComponentRecognitionEngine | null,
    layoutUnderstanding: LayoutUnderstandingEngine | null,
    navigationMapping: NavigationMappingEngine | null,
    recommendationEngine: RecommendationEngine | null,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
    options: ScreenAnnotationOptions = {},
  ) {
    const config = buildScreenAnnotationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ScreenAnnotationController(
      {
        naturalUxConversation,
        voiceUxCommands,
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        recommendationEngine,
        autonomousBuilderCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ScreenAnnotationState> {
    const doc = await this.reader.readText(SCREEN_ANNOTATION_SYSTEM_PATH);
    if (!doc?.includes("Screen Annotation")) {
      throw new Error(
        `${SCREEN_ANNOTATION_SYSTEM_PATH} missing — Screen Annotation requires T4-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAnnotationLog({
      event: "screen_annotation_engine_ready",
      level: "info",
      details: "Screen Annotation initialized",
    });
    return this.getState();
  }

  getState(): ScreenAnnotationState {
    if (!this.initializedAt) {
      throw new Error("Screen Annotation not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      annotationsCompleted: performance.totalAnnotations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-SA-001",
      missionId: "T4-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  annotate(input: AnnotationInput): AnnotationRunReport {
    return this.controller.annotate(input);
  }

  getLatestReport(): AnnotationRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): ScreenAnnotationState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopScreenAnnotation(): ScreenAnnotationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ScreenAnnotationConfiguration>,
  ): ScreenAnnotationState {
    const next = buildScreenAnnotationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Annotations completed: ${state.performance.totalAnnotations}`,
        report
          ? `Last annotation: ${report.validation.decision} · type=${report.latestAnnotation?.annotationType ?? "none"}`
          : "No annotations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ScreenAnnotationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const annotation = report?.latestAnnotation;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastAnnotationDecision,
      activeSessions: state.health.activeSessions,
      totalAnnotations: state.performance.totalAnnotations,
      intentsGenerated: state.performance.totalIntentsGenerated,
      clarificationsPending: report?.latestIntent?.clarificationRequirement ? 1 : 0,
      confidenceScore: annotation ? Math.round(annotation.confidenceScore * 100) : 0,
      uxFindingsLinked: state.performance.uxFindingsLinked,
      recentLogs: getAnnotationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createScreenAnnotation(
  bootstrap: EmpireBootstrapContext,
  naturalUxConversation: NaturalUxConversationEngine,
  voiceUxCommands: VoiceUxCommandsEngine,
  uiStateMapper: UiStateMapperEngine | null,
  componentRecognition: ComponentRecognitionEngine | null,
  layoutUnderstanding: LayoutUnderstandingEngine | null,
  navigationMapping: NavigationMappingEngine | null,
  recommendationEngine: RecommendationEngine | null,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
  options?: ScreenAnnotationOptions,
): ScreenAnnotationEngine {
  return new ScreenAnnotationEngine(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    recommendationEngine,
    autonomousBuilderCertification,
    options,
  );
}

export function resetScreenAnnotationForTesting(): void {
  resetAnnotationLogsForTesting();
  new ScreenAnnotationManager().resetForTesting();
}
