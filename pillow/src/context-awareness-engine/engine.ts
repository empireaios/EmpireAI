import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import {
  appendContextLog,
  getContextLogs,
  resetContextLogsForTesting,
} from "./context-logging.js";
import { ContextController } from "./context-controller.js";
import {
  buildContextAwarenessConfiguration,
  type ContextAwarenessConfiguration,
} from "./configuration.js";
import { CONTEXT_AWARENESS_SYSTEM_PATH } from "./paths.js";
import type {
  ContextAwarenessCockpitSnapshot,
  ContextAwarenessState,
  WorkflowContextModel,
} from "./types.js";

export interface ContextAwarenessEngineOptions {
  configuration?: Partial<ContextAwarenessConfiguration>;
  autoStart?: boolean;
}

/**
 * Context Awareness Engine (PILLOW-CAE-001 / T1-07).
 * Understands current workflow context from T1-06 interaction awareness.
 */
export class ContextAwarenessEngine {
  private initializedAt: string | null = null;
  private readonly controller: ContextController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    interactionTracking: InteractionTrackingEngine,
    navigationMapping: NavigationMappingEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    componentRecognition: ComponentRecognitionEngine,
    options: ContextAwarenessEngineOptions = {},
  ) {
    const config = buildContextAwarenessConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ContextController(
      interactionTracking,
      navigationMapping,
      layoutUnderstanding,
      componentRecognition,
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
  }

  async initialize(): Promise<ContextAwarenessState> {
    const doc = await this.reader.readText(CONTEXT_AWARENESS_SYSTEM_PATH);
    if (!doc?.includes("Context Awareness")) {
      throw new Error(
        `${CONTEXT_AWARENESS_SYSTEM_PATH} missing — Context Awareness requires T1-07 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendContextLog({
      event: "session_start",
      level: "info",
      details: "Context Awareness session initialized",
    });
    if (this.autoStart) {
      await this.controller.start();
    }
    return this.getState();
  }

  getState(): ContextAwarenessState {
    if (!this.initializedAt) {
      throw new Error("Context Awareness Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getContextBufferSize(),
    });

    return {
      engineVersion: "PILLOW-CAE-001",
      missionId: "T1-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestContext: this.controller.getLatestContext(),
      previousContext: this.controller.getPreviousContext(),
      health,
      performance,
    };
  }

  async startContextAwareness(): Promise<ContextAwarenessState> {
    await this.controller.start();
    return this.getState();
  }

  stopContextAwareness(): ContextAwarenessState {
    this.controller.stop();
    return this.getState();
  }

  pauseContextAwareness(): ContextAwarenessState {
    this.controller.pause();
    return this.getState();
  }

  resumeContextAwareness(): ContextAwarenessState {
    this.controller.resume();
    return this.getState();
  }

  getLatestContext(): WorkflowContextModel | null {
    return this.controller.getLatestContext();
  }

  getRecentContexts(limit = 5): WorkflowContextModel[] {
    return this.controller.getRecentContexts(limit);
  }

  analyzeContextNow(): WorkflowContextModel | null {
    return this.controller.analyzeNow();
  }

  updateConfiguration(
    overrides: Partial<ContextAwarenessConfiguration>,
  ): ContextAwarenessState {
    const next = buildContextAwarenessConfiguration(this.bootstrap.repositoryRoot, {
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
        `Awareness status: ${state.status}`,
        `Contexts generated: ${state.performance.successfulContexts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ContextAwarenessCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestContext;

    return {
      awarenessStatus: state.status,
      healthStatus: state.health.status,
      contextsGenerated: state.performance.successfulContexts,
      currentWorkflowName: latest?.currentWorkflowName ?? null,
      currentUserTask: latest?.currentUserTask ?? null,
      contextState: latest?.contextState ?? null,
      interactionMode: latest?.currentInteractionMode ?? null,
      changeDetected: state.performance.contextChanges > 0,
      confidenceScore: latest?.confidence ?? 0,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getContextLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createContextAwarenessEngine(
  bootstrap: EmpireBootstrapContext,
  interactionTracking: InteractionTrackingEngine,
  navigationMapping: NavigationMappingEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  componentRecognition: ComponentRecognitionEngine,
  options?: ContextAwarenessEngineOptions,
): ContextAwarenessEngine {
  return new ContextAwarenessEngine(
    bootstrap,
    interactionTracking,
    navigationMapping,
    layoutUnderstanding,
    componentRecognition,
    options,
  );
}

export function resetContextAwarenessForTesting(): void {
  resetContextLogsForTesting();
}
