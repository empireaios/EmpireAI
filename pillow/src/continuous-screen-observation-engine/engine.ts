import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ContinuousCollaborationEngine } from "../continuous-collaboration/engine.js";
import type { ExecutiveCollaborationCertificationEngine } from "../executive-collaboration-certification-engine/engine.js";
import {
  appendObservationLog,
  getObservationLogs,
  resetObservationLogsForTesting,
} from "./observation-logging.js";
import { ContinuousScreenObservationController } from "./continuous-screen-observation-controller.js";
import {
  buildContinuousScreenObservationConfiguration,
  type ContinuousScreenObservationConfiguration,
} from "./configuration.js";
import { CONTINUOUS_SCREEN_OBSERVATION_SYSTEM_PATH } from "./paths.js";
import type {
  ContinuousScreenObservationInput,
  ContinuousObservationRunReport,
  ContinuousScreenObservationCockpitSnapshot,
  ContinuousScreenObservationState,
} from "./types.js";
import { ContinuousScreenObservationManager } from "./continuous-screen-observation-manager.js";

export interface ContinuousScreenObservationOptions {
  configuration?: Partial<ContinuousScreenObservationConfiguration>;
}

/**
 * Continuous Screen Observation Engine (PILLOW-CSO-001 / T5-01).
 * Permanent UI awareness for the EmpireAI interface.
 * Safety: observe only — never applies UX changes automatically.
 */
export class ContinuousScreenObservationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ContinuousScreenObservationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    visualCapture: VisualCaptureEngine,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    uxScoring: UxScoringEngine,
    frontendBuilder: FrontendBuilder,
    continuousCollaboration: ContinuousCollaborationEngine,
    executiveCollaborationCertification: ExecutiveCollaborationCertificationEngine,
    options: ContinuousScreenObservationOptions = {},
  ) {
    const config = buildContinuousScreenObservationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ContinuousScreenObservationController(
      {
        visualCapture,
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        interactionTracking,
        contextAwareness,
        uxScoring,
        frontendBuilder,
        continuousCollaboration,
        executiveCollaborationCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ContinuousScreenObservationState> {
    const doc = await this.reader.readText(CONTINUOUS_SCREEN_OBSERVATION_SYSTEM_PATH);
    if (!doc?.includes("Continuous Screen Observation")) {
      throw new Error(
        `${CONTINUOUS_SCREEN_OBSERVATION_SYSTEM_PATH} missing — Continuous Screen Observation requires T5-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendObservationLog({
      event: "continuous_screen_observation_ready",
      level: "info",
      details: "T5-01 Continuous Screen Observation initialized",
    });
    return this.getState();
  }

  getState(): ContinuousScreenObservationState {
    if (!this.initializedAt) {
      throw new Error(
        "Continuous Screen Observation not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getSessionManager().getActiveSessionCount(),
      continuousMonitoringActive: this.controller.isContinuousMonitoringActive(),
    });

    return {
      engineVersion: "PILLOW-CSO-001",
      missionId: "T5-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      latestObservation: this.controller.getLatestObservation(),
      health,
      performance,
    };
  }

  observe(input: ContinuousScreenObservationInput = {}): ContinuousObservationRunReport {
    return this.controller.observe(input);
  }

  startContinuousObservation(): ContinuousScreenObservationState {
    this.controller.startContinuousObservation();
    return this.getState();
  }

  stopContinuousObservation(): ContinuousScreenObservationState {
    this.controller.stopContinuousObservation();
    return this.getState();
  }

  getLatestReport(): ContinuousObservationRunReport | null {
    return this.controller.getLatestReport();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<ContinuousScreenObservationConfiguration>,
  ): ContinuousScreenObservationState {
    const next = buildContinuousScreenObservationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Observations: ${state.performance.totalObservations}`,
        `Continuous monitoring: ${state.health.continuousMonitoringActive ? "active" : "inactive"}`,
        report
          ? `Last observation: ${report.validation.decision}`
          : "No observation cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ContinuousScreenObservationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const observation = state.latestObservation;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousMonitoringActive: state.health.continuousMonitoringActive,
      totalObservations: state.performance.totalObservations,
      screenChangesDetected: state.performance.screenChangesDetected,
      routeChangesDetected: state.performance.routeChangesDetected,
      layoutChangesDetected: state.performance.layoutChangesDetected,
      componentChangesDetected: state.performance.componentChangesDetected,
      confidenceScore: Math.round((observation?.confidenceScore ?? 0) * 100),
      recentLogs: getObservationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createContinuousScreenObservationEngine(
  bootstrap: EmpireBootstrapContext,
  visualCapture: VisualCaptureEngine,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  uxScoring: UxScoringEngine,
  frontendBuilder: FrontendBuilder,
  continuousCollaboration: ContinuousCollaborationEngine,
  executiveCollaborationCertification: ExecutiveCollaborationCertificationEngine,
  options?: ContinuousScreenObservationOptions,
): ContinuousScreenObservationEngine {
  return new ContinuousScreenObservationEngine(
    bootstrap,
    visualCapture,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    contextAwareness,
    uxScoring,
    frontendBuilder,
    continuousCollaboration,
    executiveCollaborationCertification,
    options,
  );
}

export function resetContinuousScreenObservationForTesting(): void {
  resetObservationLogsForTesting();
  new ContinuousScreenObservationManager().resetForTesting();
}
