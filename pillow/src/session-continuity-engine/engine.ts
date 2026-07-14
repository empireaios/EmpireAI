import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import {
  appendContinuityLog,
  getContinuityLogs,
  resetContinuityLogsForTesting,
} from "./continuity-logging.js";
import { ContinuityController } from "./continuity-controller.js";
import {
  buildSessionContinuityConfiguration,
  type SessionContinuityConfiguration,
} from "./configuration.js";
import { SESSION_CONTINUITY_SYSTEM_PATH } from "./paths.js";
import type {
  SessionContinuityCockpitSnapshot,
  SessionContinuityModel,
  SessionContinuityState,
} from "./types.js";

export interface SessionContinuityEngineOptions {
  configuration?: Partial<SessionContinuityConfiguration>;
  autoStart?: boolean;
  actorIdentifier?: string | null;
}

/**
 * Session Continuity Engine (PILLOW-SCE-001 / T1-09).
 * Preserves UX context across the active EmpireAI session.
 */
export class SessionContinuityEngine {
  private initializedAt: string | null = null;
  private readonly controller: ContinuityController;
  private readonly reader: RepositoryReader;
  private autoStart: boolean;
  private actorIdentifier: string | null = null;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    visualMemory: VisualMemoryEngine,
    options: SessionContinuityEngineOptions = {},
  ) {
    const config = buildSessionContinuityConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ContinuityController(
      bootstrap.repositoryRoot,
      uiStateMapper,
      layoutUnderstanding,
      navigationMapping,
      interactionTracking,
      contextAwareness,
      visualMemory,
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
    this.autoStart = options.autoStart ?? config.enabled;
    this.actorIdentifier = options.actorIdentifier ?? null;
  }

  async initialize(): Promise<SessionContinuityState> {
    const doc = await this.reader.readText(SESSION_CONTINUITY_SYSTEM_PATH);
    if (!doc?.includes("Session Continuity")) {
      throw new Error(
        `${SESSION_CONTINUITY_SYSTEM_PATH} missing — Session Continuity requires T1-09 system doc.`,
      );
    }
    await this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendContinuityLog({
      event: "session_start",
      level: "info",
      details: "Session Continuity engine initialized",
    });
    if (this.autoStart) {
      await this.controller.start(this.actorIdentifier);
    }
    return this.getState();
  }

  getState(): SessionContinuityState {
    if (!this.initializedAt) {
      throw new Error("Session Continuity Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      backlogSize: this.controller.getContinuityBufferSize(),
    });

    return {
      engineVersion: "PILLOW-SCE-001",
      missionId: "T1-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      activeSession: this.controller.getSession(),
      latestContinuity: this.controller.getLatestContinuity(),
      previousContinuity: this.controller.getPreviousContinuity(),
      health,
      performance,
    };
  }

  async startSessionContinuity(actorIdentifier?: string | null): Promise<SessionContinuityState> {
    this.actorIdentifier = actorIdentifier ?? this.actorIdentifier;
    await this.controller.start(this.actorIdentifier);
    return this.getState();
  }

  stopSessionContinuity(): SessionContinuityState {
    this.controller.stop();
    return this.getState();
  }

  pauseSessionContinuity(): SessionContinuityState {
    this.controller.pause();
    return this.getState();
  }

  resumeSessionContinuity(): SessionContinuityState {
    this.controller.resume();
    return this.getState();
  }

  getLatestContinuity(): SessionContinuityModel | null {
    return this.controller.getLatestContinuity();
  }

  getRecentContinuity(limit = 5): SessionContinuityModel[] {
    return this.controller.getRecentContinuity(limit);
  }

  updateContinuityNow(): SessionContinuityModel | null {
    return this.controller.updateNow();
  }

  updateConfiguration(
    overrides: Partial<SessionContinuityConfiguration>,
  ): SessionContinuityState {
    const next = buildSessionContinuityConfiguration(this.bootstrap.repositoryRoot, {
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
        `Continuity status: ${state.status}`,
        `Updates applied: ${state.performance.successfulUpdates}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SessionContinuityCockpitSnapshot {
    const state = this.getState();
    const latest = state.latestContinuity;

    return {
      continuityStatus: state.status,
      healthStatus: state.health.status,
      updatesApplied: state.performance.successfulUpdates,
      currentScreenId: latest?.currentScreenId ?? null,
      recoveryStatus: latest?.recoveryStatus ?? null,
      lastKnownStableState: latest?.lastKnownStableState ?? null,
      continuityConfidence: latest?.continuityConfidence ?? 0,
      interruptionDetected: state.performance.interruptionsDetected > 0,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getContinuityLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSessionContinuityEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  visualMemory: VisualMemoryEngine,
  options?: SessionContinuityEngineOptions,
): SessionContinuityEngine {
  return new SessionContinuityEngine(
    bootstrap,
    uiStateMapper,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    contextAwareness,
    visualMemory,
    options,
  );
}

export function resetSessionContinuityForTesting(): void {
  resetContinuityLogsForTesting();
}
