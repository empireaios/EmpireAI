import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import {
  appendInteractionLog,
  getInteractionLogs,
  resetInteractionLogsForTesting,
} from "./interaction-logging.js";
import { InteractionController } from "./interaction-controller.js";
import {
  buildInteractionTrackingConfiguration,
  type InteractionTrackingConfiguration,
} from "./configuration.js";
import { INTERACTION_TRACKING_SYSTEM_PATH } from "./paths.js";
import type {
  InteractionTrackingCockpitSnapshot,
  InteractionTrackingState,
  InteractionEvent,
  RawInteractionInput,
} from "./types.js";

export interface InteractionTrackingEngineOptions {
  configuration?: Partial<InteractionTrackingConfiguration>;
  autoStart?: boolean;
}

/**
 * Interaction Tracking Engine (PILLOW-ITE-001 / T1-06).
 * Observes user interactions with the EmpireAI interface.
 */
export class InteractionTrackingEngine {
  private initializedAt: string | null = null;
  private readonly controller: InteractionController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    navigationMapping: NavigationMappingEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    componentRecognition: ComponentRecognitionEngine,
    options: InteractionTrackingEngineOptions = {},
  ) {
    const config = buildInteractionTrackingConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new InteractionController(
      navigationMapping,
      layoutUnderstanding,
      componentRecognition,
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<InteractionTrackingState> {
    const doc = await this.reader.readText(INTERACTION_TRACKING_SYSTEM_PATH);
    if (!doc?.includes("Interaction Tracking")) {
      throw new Error(
        `${INTERACTION_TRACKING_SYSTEM_PATH} missing — Interaction Tracking requires T1-06 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendInteractionLog({
      event: "session_start",
      level: "info",
      details: "Interaction Tracking session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): InteractionTrackingState {
    if (!this.initializedAt) {
      throw new Error("Interaction Tracking Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getEventBufferSize(),
    });

    return {
      engineVersion: "PILLOW-ITE-001",
      missionId: "T1-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      recentEvents: this.controller.getRecentEvents(20),
      health,
      performance,
    };
  }

  async startInteractionTracking(): Promise<InteractionTrackingState> {
    await this.controller.start();
    return this.getState();
  }

  stopInteractionTracking(): InteractionTrackingState {
    this.controller.stop();
    return this.getState();
  }

  pauseInteractionTracking(): InteractionTrackingState {
    this.controller.pause();
    return this.getState();
  }

  resumeInteractionTracking(): InteractionTrackingState {
    this.controller.resume();
    return this.getState();
  }

  getRecentEvents(limit = 20): InteractionEvent[] {
    return this.controller.getRecentEvents(limit);
  }

  recordInteraction(raw: RawInteractionInput): InteractionEvent | null {
    return this.controller.recordInteraction(raw);
  }

  updateConfiguration(
    overrides: Partial<InteractionTrackingConfiguration>,
  ): InteractionTrackingState {
    const next = buildInteractionTrackingConfiguration(this.bootstrap.repositoryRoot, {
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
    const score = state.health.healthScore;
    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Tracking status: ${state.status}`,
        `Events recorded: ${state.performance.successfulEvents}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): InteractionTrackingCockpitSnapshot {
    const state = this.getState();
    const latest = state.recentEvents[state.recentEvents.length - 1];

    return {
      trackingStatus: state.status,
      healthStatus: state.health.status,
      eventsRecorded: state.performance.successfulEvents,
      inferredEvents: state.performance.inferredEvents,
      ingestedEvents: state.performance.ingestedEvents,
      maskedEvents: state.performance.maskedSensitiveEvents,
      latestEventTimestamp: latest?.timestamp ?? null,
      latestInteractionType: latest?.interactionType ?? null,
      currentScreenId: latest?.currentScreenId ?? null,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getInteractionLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createInteractionTrackingEngine(
  bootstrap: EmpireBootstrapContext,
  navigationMapping: NavigationMappingEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  componentRecognition: ComponentRecognitionEngine,
  options?: InteractionTrackingEngineOptions,
): InteractionTrackingEngine {
  return new InteractionTrackingEngine(
    bootstrap,
    navigationMapping,
    layoutUnderstanding,
    componentRecognition,
    options,
  );
}

export function resetInteractionTrackingForTesting(): void {
  resetInteractionLogsForTesting();
}
